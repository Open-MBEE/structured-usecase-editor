// Extracted source module for the Structured Use Case Editor reference implementation.

import { legacyRelationshipType, relationshipKinds } from "./constants.js";
import { createActorNode, createBlankSpecification, createUseCaseNode } from "./factories.js";

export function nodeKind(node) {
  return node?.specification ? "usecase" : "actor";
}

export function nodeLayout(node) {
  if (!node.layout) {
    node.layout = {
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.w ?? (nodeKind(node) === "usecase" ? 150 : 74),
      height: node.h ?? (nodeKind(node) === "usecase" ? 72 : 116)
    };
  }
  return node.layout;
}

export function normalizeUseCaseModel(model) {
  if (!model) return model;
  model.metaclass = model.metaclass ?? "UseCaseModel";
  model.id = model.id ?? "model-use-cases";
  model.name = model.name ?? "UseCaseModelInstance";

  if (model.nodes && !model.actors && !model.useCases) {
    model.actors = model.nodes
      .filter((node) => node.kind === "actor")
      .map((node) => createActorNode(node.id, node.name, node.x ?? node.layout?.x ?? 0, node.y ?? node.layout?.y ?? 0));
    model.useCases = model.nodes
      .filter((node) => node.kind === "usecase")
      .map((node) => createUseCaseNode(node.id, node.name, node.x ?? node.layout?.x ?? 0, node.y ?? node.layout?.y ?? 0, node.specification ?? createBlankSpecification()));
    delete model.nodes;
  }

  model.actors = model.actors ?? [];
  model.useCases = model.useCases ?? [];
  model.relationships = (model.relationships ?? model.edges ?? []).map((edge) => ({
    id: edge.id,
    type: legacyRelationshipType[edge.kind] ?? edge.type ?? "association",
    label: edge.label ?? relationshipKinds[legacyRelationshipType[edge.kind] ?? edge.type ?? "association"]?.lineLabel ?? "",
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    layout: edge.layout ?? {}
  }));
  delete model.edges;

  model.useCases.forEach((node) => {
    if (!node.specification) {
      node.specification = createBlankSpecification();
      node.specification.name = node.name ?? node.specification.name;
    }
    if (!node.specification.name) {
      node.specification.name = node.name ?? "Untitled Use Case";
    }
  });

  [...model.actors, ...model.useCases].forEach((node) => {
    if (!node.layout) {
      node.layout = {
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.w ?? (node.specification ? 150 : 74),
        height: node.h ?? (node.specification ? 72 : 116)
      };
    }
    delete node.x;
    delete node.y;
    delete node.w;
    delete node.h;
    delete node.kind;
  });
  return model;
}

export function parseList(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSteps(steps) {
  return steps.map((step, index) => ({ ...step, number: index + 1 }));
}
