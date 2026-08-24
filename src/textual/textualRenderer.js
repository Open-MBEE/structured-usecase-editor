// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { serializeDiagramJson } from "../serializers/jsonSerializer.js";
import { serializeUseCaseDsl } from "../serializers/ucmlSerializer.js";
import { escapeHtml, icon } from "../ui/dom.js";

export function renderJsonPanel() {
  return `
    <div class="jsonPanel">
      <textarea id="jsonDraft">${escapeHtml(state.jsonDraft)}</textarea>
      <div class="jsonActions">
        <button type="button" id="refreshJson">Refresh</button>
        <button type="button" class="primaryButton" id="loadJson">Load JSON</button>
      </div>
      <p>${escapeHtml(state.jsonMessage)}</p>
    </div>`;
}

export function renderTextualNotationPanel() {
  return `<div class="notationPanel"><pre>${escapeHtml(serializeUseCaseDsl(state.projectModel))}</pre></div>`;
}

export function renderTextualWorkspace() {
  const content = state.activeTextualTab === "json"
    ? JSON.stringify(serializeDiagramJson(state.projectModel), null, 2)
    : serializeUseCaseDsl(state.projectModel);
  return `
    <main class="textualWorkspaceGrid">
      <section class="panel textualWorkspacePanel">
        <div class="tabBar" role="tablist" aria-label="Textual serializations">
          <button type="button" id="diagramJsonTextTab" class="${state.activeTextualTab === "json" ? "active" : ""}">${icon("json")} Diagram JSON</button>
          <button type="button" id="useCaseDslTextTab" class="${state.activeTextualTab === "dsl" ? "active" : ""}">${icon("code")} UCML</button>
        </div>
        <div class="notationPanel"><pre>${escapeHtml(content)}</pre></div>
      </section>
    </main>`;
}
