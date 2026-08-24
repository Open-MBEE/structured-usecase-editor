// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { renderDocument, renderScenario } from "../serializers/documentSerializer.js";
import { renderTextualNotationPanel, renderJsonPanel } from "../textual/textualRenderer.js";
import { escapeHtml, icon } from "../ui/dom.js";

export function renderEditorColumn(base, stepAlternates, stepExceptions, selectedStepExists, includeRelatedTestCases = false) {
  return `
    <section class="editorColumn">
      <section class="panel specificationPanel">
        <div class="formGrid">
          <label>Name<input id="specName" value="${escapeHtml(state.specification.name)}" /></label>
          <label>Requirements<input id="requirements" value="${escapeHtml(state.specification.requirements.join(", "))}" /></label>
          ${includeRelatedTestCases ? `<label>Related Test Cases<input id="relatedTestCases" value="${escapeHtml(state.specification.relatedTestCases.join(", "))}" /></label>` : ""}
          <label class="wideField">Preconditions<textarea id="preconditions" rows="2">${escapeHtml(state.specification.preconditions.join("\n"))}</textarea></label>
        </div>
      </section>
      <section class="panel toolbarPanel">
        <button type="button" id="addNominalStep">${icon("plus")} Add Step</button>
        <button type="button" id="deleteNominalStep" ${!base || base.steps.length <= 1 ? "disabled" : ""}>${icon("trash")} Delete</button>
        <button type="button" id="moveUp" ${state.selectedNominalStep <= 1 ? "disabled" : ""}>${icon("up")} Move Up</button>
        <button type="button" id="moveDown" ${!base || state.selectedNominalStep >= base.steps.length ? "disabled" : ""}>${icon("down")} Move Down</button>
        <button type="button" id="addAlternate" ${!selectedStepExists ? "disabled" : ""}>${icon("plus")} Add Alternate Scenario</button>
        <button type="button" id="addException" ${!selectedStepExists ? "disabled" : ""}>${icon("plus")} Add Exception Scenario</button>
      </section>
      ${base ? renderScenario(base) : ""}
      <section class="scenarioBand alternateBand">
        <div class="bandHeader"><h2>Alternate Scenarios for Step ${state.selectedNominalStep}</h2><span>${stepAlternates.length}</span></div>
        ${stepAlternates.length ? stepAlternates.map(renderScenario).join("") : '<p class="emptyState">No alternate scenarios branch from this nominal step.</p>'}
      </section>
      <section class="scenarioBand exceptionBand">
        <div class="bandHeader"><h2>Exception Scenarios for Step ${state.selectedNominalStep}</h2><span>${stepExceptions.length}</span></div>
        ${stepExceptions.length ? stepExceptions.map(renderScenario).join("") : '<p class="emptyState">No exception scenarios branch from this nominal step.</p>'}
      </section>
    </section>`;
}

export function renderInspectorAside() {
  return `
    <aside class="rightRail">
      <section class="panel">
        <div class="tabBar" role="tablist" aria-label="Inspector panels">
          <button type="button" id="documentTab" class="${state.activeInspector === "document" ? "active" : ""}">${icon("doc")} Document</button>
          <button type="button" id="jsonTab" class="${state.activeInspector === "json" ? "active" : ""}">${icon("json")} JSON</button>
          <button type="button" id="notationTab" class="${state.activeInspector === "notation" ? "active" : ""}">${icon("code")} Textual Notation</button>
        </div>
        ${state.activeInspector === "document" ? renderDocument() : state.activeInspector === "json" ? renderJsonPanel() : renderTextualNotationPanel()}
      </section>
      <section class="buttonRow">
        <button type="button">${icon("help")} Help</button>
        <button type="button" class="primaryButton" id="applyModel">${icon("save")} Apply</button>
      </section>
    </aside>`;
}

export function renderSpecificationWorkspace(base, stepAlternates, stepExceptions, selectedStepExists) {
  return `
    <main class="specWorkspaceGrid">
      ${renderEditorColumn(base, stepAlternates, stepExceptions, selectedStepExists, true)}
      ${renderInspectorAside()}
    </main>`;
}
