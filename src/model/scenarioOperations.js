// Extracted source module for the Structured Use Case Editor reference implementation.

import { render } from "../app/state.js";
import { state } from "../app/state.js";
import { createBlankProjectModel, createBlankSpecification, createExampleProjectModel, createExampleSpecification } from "./factories.js";
import { normalizeSteps } from "./normalize.js";
import { nominal, selectedUseCaseNode } from "./selectors.js";
import { syncJsonDraft } from "../serializers/jsonSerializer.js";
import { saveProjectSnapshot } from "../storage/storageService.js";

export function setSpec(next) {
  state.specification = next;
  const useCase = selectedUseCaseNode();
  if (useCase) {
    useCase.specification = next;
    useCase.name = next.name || useCase.name;
  }
  syncJsonDraft();
  saveProjectSnapshot();
  render();
}

export function updateScenario(id, updater) {
  setSpec({
    ...state.specification,
    scenarios: renumberOffNominalScenarios(
      state.specification.scenarios.map((scenario) => (scenario.id === id ? updater(scenario) : scenario))
    )
  });
}

export function renumberOffNominalScenarios(scenarios) {
  const counts = new Map();

  return scenarios.map((scenario) => {
    if (scenario.type === "nominal" || scenario.branchStep === undefined) {
      return scenario;
    }

    const suffix = scenario.type === "alternate" ? "A" : "E";
    const key = `${scenario.branchStep}:${scenario.type}`;
    const nextCount = (counts.get(key) ?? 0) + 1;
    counts.set(key, nextCount);

    return {
      ...scenario,
      id: `${scenario.branchStep}${suffix}${nextCount > 1 ? nextCount : ""}`
    };
  });
}

export function addStepToScenario(scenarioId, afterStepNumber) {
  const scenario = state.specification.scenarios.find((item) => item.id === scenarioId);
  if (!scenario) return;
  const insertIndex =
    afterStepNumber === undefined
      ? scenario.steps.length
      : Math.max(0, scenario.steps.findIndex((step) => step.number === afterStepNumber) + 1);
  const nextSteps = [...scenario.steps];
  nextSteps.splice(insertIndex, 0, { number: insertIndex + 1, text: "" });
  const normalizedSteps = normalizeSteps(nextSteps);
  const nextStepNumber = insertIndex + 1;

  state.pendingFocusStep = { scenarioId, stepNumber: nextStepNumber };
  if (scenario.type === "nominal") {
    state.selectedNominalStep = nextStepNumber;
  }

  setSpec({
    ...state.specification,
    scenarios: state.specification.scenarios.map((item) =>
      item.id === scenarioId ? { ...item, steps: normalizedSteps } : item
    )
  });
}

export function makeScenarioId(type) {
  const suffix = type === "alternate" ? "A" : "E";
  const count = state.specification.scenarios.filter(
    (scenario) => scenario.type === type && scenario.branchStep === state.selectedNominalStep
  ).length;
  return `${state.selectedNominalStep}${suffix}${count ? count + 1 : ""}`;
}

export function addNominalStep() {
  const base = nominal();
  if (!base) {
    setSpec({
      ...state.specification,
      scenarios: [
        {
          id: "N",
          type: "nominal",
          postcondition: [],
          steps: [{ number: 1, text: "" }]
        }
      ]
    });
    state.selectedNominalStep = 1;
    return;
  }
  addStepToScenario(base.id);
}

export function deleteNominalStep() {
  const base = nominal();
  if (!base || base.steps.length <= 1) return;
  const deleted = state.selectedNominalStep;
  state.specification = {
    ...state.specification,
    scenarios: renumberOffNominalScenarios(state.specification.scenarios
      .filter((scenario) => scenario.type === "nominal" || scenario.branchStep !== deleted)
      .map((scenario) => {
        if (scenario.type === "nominal") {
          return { ...scenario, steps: normalizeSteps(scenario.steps.filter((step) => step.number !== deleted)) };
        }
        return {
          ...scenario,
          branchStep: scenario.branchStep > deleted ? scenario.branchStep - 1 : scenario.branchStep,
          rejoinStep:
            scenario.rejoinStep === deleted
              ? undefined
              : scenario.rejoinStep > deleted
                ? scenario.rejoinStep - 1
                : scenario.rejoinStep
        };
      }))
  };
  state.selectedNominalStep = Math.max(1, deleted - 1);
  render();
}

export function moveNominalStep(direction) {
  const base = nominal();
  const index = base.steps.findIndex((step) => step.number === state.selectedNominalStep);
  const swapIndex = index + direction;
  if (swapIndex < 0 || swapIndex >= base.steps.length) return;
  const swapped = state.selectedNominalStep + direction;
  const remap = (stepNumber) => {
    if (stepNumber === state.selectedNominalStep) return swapped;
    if (stepNumber === swapped) return state.selectedNominalStep;
    return stepNumber;
  };
  state.specification = {
    ...state.specification,
    scenarios: renumberOffNominalScenarios(state.specification.scenarios.map((scenario) => {
      if (scenario.id === base.id) {
        const nextSteps = [...scenario.steps];
        [nextSteps[index], nextSteps[swapIndex]] = [nextSteps[swapIndex], nextSteps[index]];
        return { ...scenario, steps: normalizeSteps(nextSteps) };
      }
      return { ...scenario, branchStep: remap(scenario.branchStep), rejoinStep: remap(scenario.rejoinStep) };
    }))
  };
  state.selectedNominalStep = swapped;
  render();
}

export function addOffNominal(type) {
  const exists = nominal()?.steps.some((step) => step.number === state.selectedNominalStep);
  if (!exists) return;
  setSpec({
    ...state.specification,
    scenarios: [
      ...state.specification.scenarios,
      {
        id: makeScenarioId(type),
        type,
        condition: type === "alternate" ? "New alternate condition" : "New exception condition",
        postcondition: [],
        branchStep: state.selectedNominalStep,
        steps: [{ number: 1, text: type === "alternate" ? "Describe alternate behavior." : "Describe exception handling." }]
      }
    ]
  });
}

export function deleteScenario(id) {
  setSpec({
    ...state.specification,
    scenarios: renumberOffNominalScenarios(state.specification.scenarios.filter((scenario) => scenario.id !== id))
  });
}

export function startBlankSpecification() {
  state.projectModel = createBlankProjectModel();
  state.specification = selectedUseCaseNode()?.specification ?? createBlankSpecification();
  state.selectedNominalStep = 1;
  state.activeWorkspace = "diagram";
  state.activeInspector = "document";
  syncJsonDraft();
  state.jsonMessage = "Blank UseCaseSpecification created.";
  saveProjectSnapshot();
  render();
}

export function loadExampleSpecification() {
  state.projectModel = createExampleProjectModel();
  state.specification = selectedUseCaseNode()?.specification ?? createExampleSpecification();
  state.selectedNominalStep = 4;
  state.activeWorkspace = "diagram";
  state.activeInspector = "document";
  syncJsonDraft();
  state.jsonMessage = "Example UseCaseSpecification loaded.";
  saveProjectSnapshot();
  render();
}
