// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { createBlankSpecification } from "../model/factories.js";
import { nodeKind } from "../model/normalize.js";
import { allRelationships, findNode, nominal } from "../model/selectors.js";
import { formatStepNumber, scenarioHeading } from "./documentSerializer.js";

export function quoteNotation(value) {
  return `"${String(value ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function notationIdentifier(value, fallback) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
  return compact || fallback;
}

export function slugId(value, fallback) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function stepStableId(useCase, scenario, step) {
  return step.id || `step-${useCase.id}-${scenario.id}-${slugId(step.text, `step-${step.number}`)}`;
}

export function basicScenarioOf(useCase) {
  return useCase.specification?.scenarios?.find((scenario) => scenario.type === "nominal" || scenario.type === "basic");
}

export function basicStepAt(useCase, stepNumber) {
  return basicScenarioOf(useCase)?.steps?.find((step) => step.number === stepNumber);
}

export function branchStepIdFor(useCase, scenario) {
  if (scenario.branchStepId) return scenario.branchStepId;
  const branchStep = basicStepAt(useCase, scenario.branchStep);
  return branchStep ? stepStableId(useCase, basicScenarioOf(useCase), branchStep) : null;
}

export function rejoinStepIdFor(useCase, scenario) {
  if (scenario.rejoinStepId) return scenario.rejoinStepId;
  const rejoinStep = basicStepAt(useCase, scenario.rejoinStep);
  return rejoinStep ? stepStableId(useCase, basicScenarioOf(useCase), rejoinStep) : null;
}

export function scenarioDslType(scenario) {
  return scenario.type === "nominal" ? "basic" : scenario.type;
}

export function scenarioBranchNumber(useCase, scenario) {
  if (scenario.branchStep) return scenario.branchStep;
  const branchStepId = branchStepIdFor(useCase, scenario);
  const base = basicScenarioOf(useCase);
  const index = base?.steps?.findIndex((step) => stepStableId(useCase, base, step) === branchStepId) ?? -1;
  return index >= 0 ? index + 1 : null;
}

export function scenarioDslLabel(useCase, scenario) {
  const type = scenarioDslType(scenario);
  if (type === "basic") return "basic";
  const branchNumber = scenarioBranchNumber(useCase, scenario) ?? "unresolved";
  const sameBranch = (useCase.specification?.scenarios ?? []).filter(
    (item) => scenarioDslType(item) === type && scenarioBranchNumber(useCase, item) === branchNumber
  );
  const index = Math.max(0, sameBranch.findIndex((item) => item === scenario));
  const startCode = type === "alternate" ? "A".charCodeAt(0) : "E".charCodeAt(0);
  return `${branchNumber}${String.fromCharCode(startCode + index)}`;
}

export function primaryActorIdFor(useCase) {
  if (useCase.specification?.primaryActorId) return useCase.specification.primaryActorId;
  const relationship = allRelationships().find((item) => {
    const source = findNode(item.sourceId);
    const target = findNode(item.targetId);
    return item.type === "association" &&
      ((source && nodeKind(source) === "actor" && item.targetId === useCase.id) ||
        (target && nodeKind(target) === "actor" && item.sourceId === useCase.id));
  });
  if (!relationship) return null;
  const source = findNode(relationship.sourceId);
  return nodeKind(source) === "actor" ? relationship.sourceId : relationship.targetId;
}

export function pushStringBlock(lines, name, values, indent) {
  const populated = (values ?? []).filter((item) => item.trim());
  if (!populated.length) return;
  lines.push(`${indent}${name} {`);
  populated.forEach((value) => lines.push(`${indent}  ${quoteNotation(value)};`));
  lines.push(`${indent}}`);
  lines.push("");
}

export function serializeUseCaseDsl(model) {
  const lines = [`model ${notationIdentifier(model.name, "useCaseModel")} {`, ""];

  (model.actors ?? []).forEach((actor) => {
    lines.push(`  actor ${notationIdentifier(actor.name, actor.id)} {`);
    lines.push(`    id: ${quoteNotation(actor.id)};`);
    lines.push(`    name: ${quoteNotation(actor.name)};`);
    lines.push("  }");
    lines.push("");
  });

  (model.useCases ?? []).forEach((useCase) => {
    const spec = useCase.specification ?? createBlankSpecification();
    lines.push(`  use case ${quoteNotation(useCase.name || "Untitled Use Case")} {`);
    lines.push(`    id: ${quoteNotation(useCase.id)};`);
    lines.push("");
    lines.push("    specification {");

    const primaryActorId = primaryActorIdFor(useCase);
    if (primaryActorId) {
      lines.push(`      primaryActorId: ${quoteNotation(primaryActorId)};`);
      lines.push("");
    }

    pushStringBlock(lines, "requirements", spec.requirements, "      ");
    pushStringBlock(lines, "relatedTestCases", spec.relatedTestCases, "      ");
    pushStringBlock(lines, "preconditions", spec.preconditions, "      ");

    (spec.scenarios ?? []).forEach((scenario) => {
      const type = scenarioDslType(scenario);
      const label = scenarioDslLabel(useCase, scenario);
      lines.push(type === "basic" ? "      scenario basic {" : `      scenario ${type} ${label} {`);

      if (type !== "basic") {
        const branchStepId = branchStepIdFor(useCase, scenario);
        if (branchStepId) lines.push(`        branchStepId: ${quoteNotation(branchStepId)};`);
        if (scenario.condition?.trim()) lines.push(`        condition: ${quoteNotation(scenario.condition)};`);
        const rejoinStepId = rejoinStepIdFor(useCase, scenario);
        if (rejoinStepId) lines.push(`        rejoinStepId: ${quoteNotation(rejoinStepId)};`);
        const endsUseCase = scenario.endsUseCase ?? !rejoinStepId;
        lines.push(`        endsUseCase: ${endsUseCase ? "true" : "false"};`);
        lines.push("");
      }

      (scenario.steps ?? []).forEach((step, index) => {
        const displayedStep = type === "basic" ? String(index + 1) : `${label}.${index + 1}`;
        lines.push(`        step ${displayedStep} {`);
        lines.push(`          id: ${quoteNotation(stepStableId(useCase, scenario, step))};`);
        lines.push(`          text: ${quoteNotation(step.text)};`);
        lines.push("        }");
        lines.push("");
      });

      const postconditions = scenario.postconditions ?? scenario.postcondition ?? [];
      const populatedPostconditions = postconditions.filter((item) => item.trim());
      if (populatedPostconditions.length) {
        lines.push("        postconditions {");
        populatedPostconditions.forEach((postcondition) => lines.push(`          ${quoteNotation(postcondition)};`));
        lines.push("        }");
      }

      lines.push("      }");
      lines.push("");
    });

    lines.push("    }");
    lines.push("  }");
    lines.push("");
  });

  (model.relationships ?? []).forEach((relationship) => {
    lines.push(`  ${relationship.type} ${quoteNotation(relationship.label || relationship.id)} {`);
    lines.push(`    id: ${quoteNotation(relationship.id)};`);
    lines.push(`    sourceId: ${quoteNotation(relationship.sourceId)};`);
    lines.push(`    targetId: ${quoteNotation(relationship.targetId)};`);
    lines.push("  }");
    lines.push("");
  });

  lines.push("}");
  return lines.join("\n");
}

export function renderNotationList(name, values, indent) {
  const populated = values.filter((item) => item.trim());
  if (!populated.length) return [];
  return [`${indent}attribute ${name} : String[*] = (${populated.map(quoteNotation).join(", ")});`];
}

export function renderNotationScenario(scenario, indent) {
  const typeTag = scenario.type === "nominal" ? "nominal" : scenario.type;
  const lines = [
    `${indent}scenario ${typeTag} '${scenario.id}' {`,
    `${indent}  @kernel::Scenario { type = ${quoteNotation(scenario.type)}; label = ${quoteNotation(scenarioHeading(scenario))}; }`
  ];

  if (scenario.condition?.trim()) {
    lines.push(`${indent}  condition ${quoteNotation(scenario.condition)};`);
  }

  if (scenario.type !== "nominal") {
    lines.push(`${indent}  branchStep = stepRef(${scenario.branchStep ?? "unresolved"});`);
    lines.push(
      scenario.rejoinStep
        ? `${indent}  rejoinStep = stepRef(${scenario.rejoinStep});`
        : `${indent}  rejoinStep = useCaseEnd;`
    );
  }

  scenario.steps.forEach((step) => {
    lines.push(`${indent}  step ${formatStepNumber(scenario, step)} {`);
    lines.push(`${indent}    @kernel::Step { number = ${step.number}; }`);
    lines.push(`${indent}    action ${quoteNotation(step.text)};`);
    lines.push(`${indent}  }`);
  });

  (scenario.postcondition ?? [])
    .filter((item) => item.trim())
    .forEach((postcondition, index) => {
      lines.push(`${indent}  postcondition p${index + 1} = ${quoteNotation(postcondition)};`);
    });

  lines.push(`${indent}}`);
  return lines;
}

export function generateTextualNotation() {
  const useCaseName = state.specification.name.trim() || "Untitled Use Case";
  const useCaseId = notationIdentifier(useCaseName, "untitledUseCase");
  const base = nominal();
  const offNominal = state.specification.scenarios.filter((scenario) => scenario.type !== "nominal");
  const lines = [
    "package UseCaseSpecifications {",
    `  use case def ${useCaseId} {`,
    `    @kernel::UseCaseSpecification { name = ${quoteNotation(useCaseName)}; }`
  ];

  lines.push(...renderNotationList("preconditions", state.specification.preconditions, "    "));
  lines.push(...renderNotationList("requirements", state.specification.requirements, "    "));
  lines.push(...renderNotationList("relatedTestCases", state.specification.relatedTestCases, "    "));

  if (base) {
    lines.push("");
    lines.push(...renderNotationScenario(base, "    "));
  }

  offNominal.forEach((scenario) => {
    lines.push("");
    lines.push(...renderNotationScenario(scenario, "    "));
  });

  lines.push("  }");
  lines.push("}");
  return lines.join("\n");
}
