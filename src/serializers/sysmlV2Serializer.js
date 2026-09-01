// SysML v2 serializer for the OpenMBEE Structured Use Cases library.

import { state } from "../app/state.js";
import { createBlankSpecification } from "../model/factories.js";
import { nodeKind } from "../model/normalize.js";
import { allRelationships, findNode } from "../model/selectors.js";
import {
  notationIdentifier,
  primaryActorIdFor,
  scenarioBranchNumber,
  scenarioDslLabel,
  scenarioDslType
} from "./ucmlSerializer.js";

function quotedName(value, fallback = "Unnamed") {
  return `'${String(value || fallback).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function nonEmpty(values) {
  return (values ?? []).map((value) => String(value ?? "").trim()).filter(Boolean);
}

function actorUsageName(actor) {
  return notationIdentifier(actor.name, actor.id || "actor");
}

function packageIdentifier(value, fallback) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!compact) return fallback;
  return /^[a-zA-Z_]/.test(compact) ? compact : `_${compact}`;
}

function relationshipName(relationship, source, target) {
  const readableType = relationship.type === "precedes" ? "precede" : relationship.type;
  if (relationship.type === "association") {
    return `${source?.name ?? relationship.sourceId} - ${target?.name ?? relationship.targetId}`;
  }
  return relationship.label?.replace(/[«»]/g, "").trim() || readableType;
}

function stepLabel(scenarioLabel, scenarioType, step, index) {
  return scenarioType === "basic" ? String(index + 1) : `${scenarioLabel}.${index + 1}`;
}

function stepActionName(scenarioLabel, scenarioType, step, index) {
  const id = stepLabel(scenarioLabel, scenarioType, step, index);
  const text = String(step.text || "Describe step").trim();
  return `${id} ${text}`;
}

function pushDocBlock(lines, title, values, indent) {
  const entries = nonEmpty(values);
  if (!entries.length) return;

  lines.push(`${indent}doc /*`);
  lines.push(`${indent} * ${title}`);
  entries.forEach((entry) => lines.push(`${indent} * - ${entry.replaceAll("*/", "* /")}`));
  lines.push(`${indent} */`);
  lines.push("");
}

function pushScenarioSuccessions(lines, stepNames, branchNumber, indent) {
  if (!stepNames.length) return;

  if (branchNumber) {
    lines.push(`${indent}succession ${quotedName(`Branch after Step ${branchNumber}`)}`);
    lines.push(`${indent}    first start`);
    lines.push(`${indent}    then ${quotedName(stepNames[0])};`);
    lines.push("");
  } else {
    lines.push(`${indent}first start then ${quotedName(stepNames[0])};`);
  }

  for (let index = 0; index < stepNames.length - 1; index += 1) {
    lines.push(`${indent}first ${quotedName(stepNames[index])}`);
    lines.push(`${indent}    then ${quotedName(stepNames[index + 1])};`);
  }

  lines.push(`${indent}first ${quotedName(stepNames[stepNames.length - 1])} then done;`);
  lines.push("");
}

function pushPostconditions(lines, scenario, indent) {
  const postconditions = nonEmpty(scenario.postconditions ?? scenario.postcondition);
  postconditions.forEach((postcondition) => {
    lines.push(`${indent}#postcondition constraint`);
    lines.push(`${indent}    ${quotedName(postcondition)};`);
  });
  if (postconditions.length) lines.push("");
}

function serializeScenario(lines, useCase, scenario, indent) {
  const type = scenarioDslType(scenario);
  const label = scenarioDslLabel(useCase, scenario);
  const defaultName = type === "basic" ? "Basic Scenario" : `${type.charAt(0).toUpperCase()}${type.slice(1)} Scenario`;
  const scenarioName = type === "basic"
    ? defaultName
    : `${label} ${String(scenario.condition || defaultName).trim()}`;
  const branchNumber = type === "basic" ? null : scenarioBranchNumber(useCase, scenario);

  lines.push(`${indent}action${scenarioName ? ` ${quotedName(scenarioName)}` : ""} {`);
  lines.push("");

  const stepNames = [];
  (scenario.steps ?? []).forEach((step, index) => {
    const id = stepLabel(label, type, step, index);
    const name = stepActionName(label, type, step, index);
    stepNames.push(name);
    lines.push(`${indent}    #step action ${quotedName(name)} {`);
    lines.push(`${indent}    }`);
    lines.push("");
  });

  const rejoinStep = type !== "basic" ? scenario.rejoinStep : null;
  if (rejoinStep) {
    const id = stepLabel(label, type, {}, stepNames.length);
    const name = `${id} Rejoin before Step ${rejoinStep}`;
    stepNames.push(name);
    lines.push(`${indent}    #step action ${quotedName(name)} {`);
    lines.push(`${indent}    }`);
    lines.push("");
  }

  pushScenarioSuccessions(lines, stepNames, branchNumber, `${indent}    `);
  pushPostconditions(lines, scenario, `${indent}    `);
  lines.push(`${indent}}`);
}

function serializeUseCase(lines, useCase) {
  const spec = useCase.specification ?? createBlankSpecification();
  const scenarios = spec.scenarios ?? [];
  const populatedRequirements = nonEmpty(spec.requirements);
  const populatedTests = nonEmpty(spec.relatedTestCases);
  const populatedPreconditions = nonEmpty(spec.preconditions);
  const hasBody = scenarios.length || populatedRequirements.length || populatedTests.length || populatedPreconditions.length || primaryActorIdFor(useCase);

  if (!hasBody) {
    lines.push(`    use case ${quotedName(useCase.name || spec.name || "Untitled Use Case")};`);
    lines.push("");
    return;
  }

  lines.push(`    use case ${quotedName(useCase.name || spec.name || "Untitled Use Case")} {`);
  lines.push("");

  const primaryActorId = primaryActorIdFor(useCase);
  if (primaryActorId) {
    const actor = findNode(primaryActorId);
    if (actor) {
      lines.push(`        doc /* Primary actor: ${actor.name} */`);
      lines.push("");
    }
  }

  pushDocBlock(lines, "Requirements", populatedRequirements, "        ");
  pushDocBlock(lines, "Related test cases", populatedTests, "        ");

  populatedPreconditions.forEach((precondition) => {
    lines.push(`        #precondition constraint ${quotedName(precondition)};`);
  });
  if (populatedPreconditions.length) lines.push("");

  scenarios.forEach((scenario, index) => {
    serializeScenario(lines, useCase, scenario, "        ");
    if (index < scenarios.length - 1) lines.push("");
  });

  lines.push("    }");
  lines.push("");
}

function serializeRelationship(lines, relationship) {
  const source = findNode(relationship.sourceId);
  const target = findNode(relationship.targetId);
  if (!source || !target) return;

  const sourceRef = nodeKind(source) === "actor" ? actorUsageName(source) : quotedName(source.name, source.id);
  const targetRef = nodeKind(target) === "actor" ? actorUsageName(target) : quotedName(target.name, target.id);

  lines.push(`    connection ${quotedName(relationshipName(relationship, source, target))}`);
  lines.push(`        connect ${sourceRef} to ${targetRef};`);
  lines.push("");
}

export function serializeSysmlV2(model) {
  const lines = [`package ${packageIdentifier(model.name, "UseCaseModel")} {`, "", "    private import StructuredUseCases::*;", ""];

  (model.actors ?? []).forEach((actor) => {
    lines.push(`    #useCaseActor part ${actorUsageName(actor)};`);
  });
  if ((model.actors ?? []).length) lines.push("");

  (model.useCases ?? []).forEach((useCase) => serializeUseCase(lines, useCase));
  (model.relationships ?? []).forEach((relationship) => serializeRelationship(lines, relationship));

  lines.push("}");
  return lines.join("\n");
}

export function generateSysmlV2Notation() {
  return serializeSysmlV2(state.projectModel);
}
