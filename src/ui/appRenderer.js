// Extracted source module for the Structured Use Case Editor reference implementation.

import { appVersion, root, state } from "../app/state.js";
import { installDiagramDragHandlers } from "../diagram/diagramInteractions.js";
import { renderDiagram } from "../diagram/diagramRenderer.js";
import { labels } from "../model/constants.js";
import { nominal, offNominalForSelected, selectedUseCaseNode } from "../model/selectors.js";
import { renderSpecificationWorkspace, renderEditorColumn, renderInspectorAside } from "../specification/specificationRenderer.js";
import { renderTextualWorkspace } from "../textual/textualRenderer.js";
import { escapeHtml, icon } from "./dom.js";
import { bindEvents } from "./eventBinding.js";

function bindDiagramWorkspaceEvents() {
  installDiagramDragHandlers();
  setTimeout(installDiagramDragHandlers, 0);
}

export function renderWorkspaceTabs() {
  const selectedUseCase = selectedUseCaseNode();
  return `
    <nav class="workspaceTabs" aria-label="Editor workspaces">
      <button type="button" id="diagramWorkspaceTab" data-workspace="diagram" class="${state.activeWorkspace === "diagram" ? "active" : ""}">
        ${icon("branch")} Diagram Editor
      </button>
      <button type="button" id="specWorkspaceTab" data-workspace="specification" class="${state.activeWorkspace === "specification" ? "active" : ""}" ${selectedUseCase ? "" : "disabled"}>
        ${icon("doc")} Specification Editor${selectedUseCase ? `: ${escapeHtml(selectedUseCase.name || "Untitled")}` : ""}
      </button>
      <button type="button" id="textualWorkspaceTab" data-workspace="textual" class="${state.activeWorkspace === "textual" ? "active" : ""}">
        ${icon("code")} Textual View
      </button>
    </nav>`;
}

export function renderDiagramWorkspace() {
  return `
    <main class="diagramWorkspaceGrid">
      <section>
        ${renderDiagram()}
      </section>
      <aside class="diagramSideRail">
        <section class="panel compactPanel">
          <h2>Selected Use Case</h2>
          <p class="mutedText">Double-click a use case bubble to open its specification editor.</p>
          <div class="fieldStack">
            <label>Related Test Cases<input id="relatedTestCases" value="${escapeHtml(state.specification.relatedTestCases.join(", "))}" /></label>
          </div>
        </section>
        ${renderInspectorAside()}
      </aside>
    </main>`;
}

export function render() {
  const base = nominal();
  const stepAlternates = offNominalForSelected("alternate");
  const stepExceptions = offNominalForSelected("exception");
  const selectedStepExists = Boolean(base?.steps.some((step) => step.number === state.selectedNominalStep));

  if (state.specOnlyNodeId) {
    const node = selectedUseCaseNode();
    root.innerHTML = `
      <div class="appShell specOnlyShell">
        <header class="topBar">
          <div class="brandMark">${icon("branch")}</div>
          <div>
            <h1>Structured Use Case Editor</h1>
            <p>Specification tab for ${escapeHtml(node?.name ?? "selected use case")}. v${appVersion}</p>
          </div>
          <div class="topActions">
            <button type="button" id="newBlank">${icon("plus")} New Blank</button>
            <button type="button" id="loadExample">${icon("reset")} Load Example</button>
          </div>
        </header>
        <main class="specOnlyGrid">
          ${renderEditorColumn(base, stepAlternates, stepExceptions, selectedStepExists, true)}
          ${renderInspectorAside()}
        </main>
      </div>`;

    bindDiagramWorkspaceEvents();
    bindEvents();
    return;
  }

  root.innerHTML = `
    <div class="appShell">
      <header class="topBar">
        <div class="brandMark">${icon("branch")}</div>
        <div>
          <h1>Structured Use Case Editor</h1>
          <p>Reference editor for creating structured use case diagrams and specifications. v${appVersion}</p>
        </div>
        <div class="topActions">
          <button type="button" id="newBlank">${icon("plus")} New Blank</button>
          <button type="button" id="loadExample">${icon("reset")} Load Example</button>
        </div>
      </header>
      ${renderWorkspaceTabs()}
      ${state.activeWorkspace === "diagram"
        ? renderDiagramWorkspace()
        : state.activeWorkspace === "specification"
          ? renderSpecificationWorkspace(base, stepAlternates, stepExceptions, selectedStepExists)
          : renderTextualWorkspace()}
    </div>`;

  bindDiagramWorkspaceEvents();
  bindEvents();
}
