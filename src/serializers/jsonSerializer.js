// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { clone } from "../model/factories.js";
import { nodeLayout } from "../model/normalize.js";

export function syncJsonDraft() {
  state.jsonDraft = JSON.stringify(state.projectModel, null, 2);
}

export function serializeDiagramJson(model) {
  return {
    metaclass: "UseCaseDiagramSet",
    id: `${model.id ?? "model-use-cases"}-diagrams`,
    name: `${model.name ?? "UseCaseModelInstance"} Diagrams`,
    modelId: model.id ?? "model-use-cases",
    diagrams: [
      {
        id: "diagram-main",
        name: "Use Case Diagram",
        nodeViews: [
          ...(model.actors ?? []).map((actor) => ({
            id: `view-${actor.id}`,
            elementId: actor.id,
            elementType: "actor",
            layout: clone(nodeLayout(actor))
          })),
          ...(model.useCases ?? []).map((useCase) => ({
            id: `view-${useCase.id}`,
            elementId: useCase.id,
            elementType: "useCase",
            layout: clone(nodeLayout(useCase))
          }))
        ],
        relationshipViews: (model.relationships ?? []).map((relationship) => ({
          id: `view-${relationship.id}`,
          relationshipId: relationship.id,
          waypoints: relationship.layout?.waypoints ?? [],
          labelPosition: relationship.layout?.labelPosition ?? null
        }))
      }
    ]
  };
}
