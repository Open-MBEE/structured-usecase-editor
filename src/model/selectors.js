// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";

export function allNodes() {
  return [...(state.projectModel.actors ?? []), ...(state.projectModel.useCases ?? [])];
}

export function allRelationships() {
  return state.projectModel.relationships ?? [];
}

export function findNode(id) {
  return allNodes().find((node) => node.id === id);
}

export function selectedUseCaseNode() {
  const selected = state.projectModel.useCases.find((node) => node.id === state.projectModel.selectedNodeId);
  if (selected) return selected;
  return state.projectModel.useCases[0];
}

export function selectedNode() {
  return findNode(state.projectModel.selectedNodeId);
}

export function selectedEdge() {
  return allRelationships().find((edge) => edge.id === state.projectModel.selectedEdgeId);
}

export function nominal() {
  return state.specification.scenarios.find((scenario) => scenario.type === "nominal");
}

export function offNominalForSelected(type) {
  return state.specification.scenarios.filter(
    (scenario) => scenario.type === type && scenario.branchStep === state.selectedNominalStep
  );
}
