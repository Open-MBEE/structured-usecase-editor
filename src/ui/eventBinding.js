// Extracted source module for the Structured Use Case Editor reference implementation.

import { render, scheduleRender, state } from "../app/state.js";
import { addDiagramNode, commitDiagramLabelEdit, deleteDiagramSelection, renameSelectedDiagramNode, setPaletteTool, startDiagramLabelEdit } from "../diagram/diagramInteractions.js";
import { normalizeSteps, normalizeUseCaseModel, parseList } from "../model/normalize.js";
import { nominal, selectedUseCaseNode } from "../model/selectors.js";
import { addNominalStep, addOffNominal, addStepToScenario, deleteNominalStep, deleteScenario, loadExampleSpecification, moveNominalStep, startBlankSpecification, updateScenario } from "../model/scenarioOperations.js";
import { syncJsonDraft } from "../serializers/jsonSerializer.js";
import { serializeSysmlV2 } from "../serializers/sysmlV2Serializer.js";
import { saveProjectSnapshot } from "../storage/storageService.js";
import { createBlankSpecification } from "../model/factories.js";

function fileSafeName(value, fallback) {
  const name = String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name || fallback;
}

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function saveTextFile(filename, content, type = "text/plain", extension = "") {
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: extension ? `${extension.toUpperCase()} file` : "Text file",
          accept: { [type.split(";")[0]]: extension ? [extension] : [".txt"] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return "picked";
  }

  downloadTextFile(filename, content, type);
  return "downloaded";
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function bindEvents() {
  const bind = (selector, event, handler) => {
    const element = document.querySelector(selector);
    if (element) element.addEventListener(event, handler);
  };
  const updateJsonDraft = () => {
    syncJsonDraft();
    saveProjectSnapshot();
  };
  const switchWorkspace = (workspace) => {
    if (workspace === "specification") {
      const useCase = selectedUseCaseNode();
      if (!useCase) return;
      state.projectModel.selectedNodeId = useCase.id;
      state.specification = useCase.specification;
    }
    state.activeWorkspace = workspace;
    saveProjectSnapshot();
    render();
  };
  const workspaceTabs = document.querySelector(".workspaceTabs");
  if (workspaceTabs) {
    workspaceTabs.addEventListener("mousedown", (event) => {
      const button = event.target.closest("[data-workspace]");
      if (!button || button.disabled) return;
      event.preventDefault();
      switchWorkspace(button.dataset.workspace);
    });
    workspaceTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-workspace]");
      if (!button || button.disabled) return;
      switchWorkspace(button.dataset.workspace);
    });
  }

  bind("#newBlank", "click", startBlankSpecification);
  bind("#loadExample", "click", loadExampleSpecification);
  bind("#diagramJsonTextTab", "click", () => {
    state.activeTextualTab = "json";
    render();
  });
  bind("#sysmlV2TextTab", "click", () => {
    state.activeTextualTab = "sysml";
    render();
  });
  bind("#copySysmlV2", "click", async () => {
    try {
      await copyTextToClipboard(serializeSysmlV2(state.projectModel));
      state.textualMessage = "SysML v2 copied to the clipboard.";
    } catch {
      state.textualMessage = "SysML v2 could not be copied.";
    }
    render();
  });
  bind("#exportSysmlV2", "click", async () => {
    const filename = `${fileSafeName(state.projectModel?.name, "UseCaseModel")}.sysml`;
    try {
      const result = await saveTextFile(filename, serializeSysmlV2(state.projectModel), "text/plain;charset=utf-8", ".sysml");
      state.textualMessage = result === "picked" ? `Saved ${filename}.` : `Downloaded ${filename}.`;
    } catch (error) {
      state.textualMessage = error?.name === "AbortError" ? "SysML v2 export cancelled." : `${filename} could not be exported.`;
    }
    render();
  });
  bind("#saveModelFile", "click", async () => {
    syncJsonDraft();
    const filename = `${fileSafeName(state.projectModel?.name, "UseCaseModel")}.ucm.json`;
    try {
      const result = await saveTextFile(filename, state.jsonDraft, "application/json;charset=utf-8", ".json");
      state.textualMessage = result === "picked" ? `Saved ${filename}.` : `Downloaded ${filename}.`;
    } catch (error) {
      state.textualMessage = error?.name === "AbortError" ? "Model save cancelled." : `${filename} could not be saved.`;
    }
    render();
  });
  bind("#openModelFile", "click", () => {
    document.getElementById("modelFileInput")?.click();
  });
  bind("#modelFileInput", "change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      state.projectModel = normalizeUseCaseModel(JSON.parse(text));
      state.specification = selectedUseCaseNode()?.specification ?? createBlankSpecification();
      state.selectedNominalStep = nominal()?.steps[0]?.number ?? 1;
      syncJsonDraft();
      saveProjectSnapshot();
      state.textualMessage = `Opened ${file.name}.`;
      state.jsonMessage = "Loaded model file.";
    } catch {
      state.textualMessage = `${file.name} could not be opened.`;
    }
    event.target.value = "";
    render();
  });
  bind("#deleteDiagramSelection", "click", deleteDiagramSelection);
  bind("#selectedDiagramName", "input", (event) => {
    renameSelectedDiagramNode(event.target.value);
  });
  bind("#selectedDiagramName", "blur", scheduleRender);
  bind("#renameDiagramNode", "click", () => {
    const input = document.getElementById("selectedDiagramName");
    if (input && !input.disabled) {
      input.focus();
      input.select();
    }
  });
  bind("#specName", "input", (event) => {
    state.specification.name = event.target.value;
    const useCase = selectedUseCaseNode();
    if (useCase) useCase.name = event.target.value || useCase.name;
    updateJsonDraft();
  });
  bind("#specName", "blur", scheduleRender);
  bind("#requirements", "input", (event) => {
    state.specification.requirements = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#requirements", "blur", scheduleRender);
  bind("#preconditions", "input", (event) => {
    state.specification.preconditions = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#preconditions", "blur", scheduleRender);
  bind("#relatedTestCases", "input", (event) => {
    state.specification.relatedTestCases = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#relatedTestCases", "blur", scheduleRender);
  bind("#addNominalStep", "click", addNominalStep);
  bind("#deleteNominalStep", "click", deleteNominalStep);
  bind("#moveUp", "click", () => moveNominalStep(-1));
  bind("#moveDown", "click", () => moveNominalStep(1));
  bind("#addAlternate", "click", () => addOffNominal("alternate"));
  bind("#addException", "click", () => addOffNominal("exception"));
  bind("#applyModel", "click", () => {
    saveProjectSnapshot();
    render();
  });
  bind("#documentTab", "click", () => {
    state.activeInspector = "document";
    render();
  });
  bind("#jsonTab", "click", () => {
    state.activeInspector = "json";
    render();
  });
  bind("#notationTab", "click", () => {
    state.activeInspector = "notation";
    render();
  });

  document.querySelectorAll("[data-palette-tool]").forEach((element) => {
    element.addEventListener("click", () => {
      setPaletteTool(element.dataset.paletteTool);
    });
  });

  document.querySelectorAll("[data-palette-relationship]").forEach((element) => {
    element.addEventListener("click", () => {
      setPaletteTool("relationship", element.dataset.paletteRelationship);
    });
  });

  document.querySelectorAll("[data-diagram-label-input]").forEach((element) => {
    element.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitDiagramLabelEdit(element.dataset.diagramLabelInput, element.value);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        state.editingDiagramLabelId = "";
        render();
      }
    });
    element.addEventListener("blur", () => {
      commitDiagramLabelEdit(element.dataset.diagramLabelInput, element.value);
    });
  });

  bind("#refreshJson", "click", () => {
    syncJsonDraft();
    state.jsonMessage = "JSON refreshed from the in-memory model.";
    render();
  });
  bind("#loadJson", "click", () => {
    try {
      state.projectModel = normalizeUseCaseModel(JSON.parse(document.getElementById("jsonDraft").value));
      state.specification = selectedUseCaseNode()?.specification ?? createBlankSpecification();
      state.selectedNominalStep = nominal()?.steps[0]?.number ?? 1;
      syncJsonDraft();
      state.jsonMessage = "Loaded JSON into the UseCaseModel.";
    } catch {
      state.jsonMessage = "JSON could not be parsed.";
    }
    render();
  });
  bind("#jsonDraft", "input", (event) => {
    state.jsonDraft = event.target.value;
  });

  document.querySelectorAll("[data-select-step]").forEach((element) => {
    element.addEventListener("click", () => {
      const step = Number(element.dataset.selectStep);
      if (step) {
        state.selectedNominalStep = step;
        render();
      }
    });
  });
  document.querySelectorAll("[data-step-text]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("input", (event) => {
      const [scenarioId, stepNumber] = element.dataset.stepText.split(":");
      const scenario = state.specification.scenarios.find((item) => item.id === scenarioId);
      const step = scenario?.steps.find((item) => item.number === Number(stepNumber));
      if (step) {
        step.text = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        const [scenarioId, stepNumber] = element.dataset.stepText.split(":");
        addStepToScenario(scenarioId, Number(stepNumber));
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-delete-step]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const [scenarioId, stepNumber] = element.dataset.deleteStep.split(":");
      updateScenario(scenarioId, (scenario) => ({
        ...scenario,
        steps: normalizeSteps(scenario.steps.filter((step) => step.number !== Number(stepNumber)))
      }));
    });
  });
  document.querySelectorAll("[data-add-step]").forEach((element) => {
    element.addEventListener("click", () => {
      const scenarioId = element.dataset.addStep;
      addStepToScenario(scenarioId);
    });
  });
  document.querySelectorAll("[data-delete-scenario]").forEach((element) => {
    element.addEventListener("click", () => deleteScenario(element.dataset.deleteScenario));
  });
  document.querySelectorAll("[data-scenario-id]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const oldId = element.dataset.scenarioId;
      const scenario = state.specification.scenarios.find((item) => item.id === oldId);
      if (scenario) {
        scenario.id = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-scenario-condition]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const scenario = state.specification.scenarios.find((item) => item.id === element.dataset.scenarioCondition);
      if (scenario) {
        scenario.condition = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-scenario-branch]").forEach((element) => {
    element.addEventListener("change", (event) => {
      updateScenario(element.dataset.scenarioBranch, (scenario) => ({ ...scenario, branchStep: Number(event.target.value) || undefined }));
    });
  });
  document.querySelectorAll("[data-scenario-rejoin]").forEach((element) => {
    element.addEventListener("change", (event) => {
      updateScenario(element.dataset.scenarioRejoin, (scenario) => ({ ...scenario, rejoinStep: Number(event.target.value) || undefined }));
    });
  });
  document.querySelectorAll("[data-postcondition]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const scenario = state.specification.scenarios.find((item) => item.id === element.dataset.postcondition);
      if (scenario) {
        scenario.postcondition = parseList(event.target.value);
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });

  if (state.pendingFocusStep) {
    const selector = `[data-step-text="${state.pendingFocusStep.scenarioId}:${state.pendingFocusStep.stepNumber}"]`;
    const nextInput = document.querySelector(selector);
    state.pendingFocusStep = null;
    if (nextInput) {
      nextInput.focus();
    }
  }

  if (state.editingDiagramLabelId) {
    const input = document.querySelector(`[data-diagram-label-input="${state.editingDiagramLabelId}"]`);
    if (input) {
      input.focus();
      input.select();
      return;
    }
  }

  if (state.pendingFocusDiagramName) {
    state.pendingFocusDiagramName = false;
    const input = document.getElementById("selectedDiagramName");
    if (input && !input.disabled) {
      input.focus();
      input.select();
    }
  }
}
