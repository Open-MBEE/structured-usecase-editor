// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { serializeDiagramJson } from "../serializers/jsonSerializer.js";
import { serializeSysmlV2 } from "../serializers/sysmlV2Serializer.js";
import { escapeHtml, icon } from "../ui/dom.js";

export function renderJsonPanel() {
  return `
    <div class="jsonPanel">
      <textarea id="jsonDraft">${escapeHtml(state.jsonDraft)}</textarea>
      <div class="jsonActions">
        <button type="button" id="refreshJson">Refresh</button>
        <button type="button" class="primaryButton" id="loadJson">Load JSON</button>
        <button type="button" id="saveModelFile">${icon("save")} Save Model</button>
        <button type="button" id="openModelFile">${icon("folder")} Open Model</button>
        <input type="file" id="modelFileInput" accept=".json,.ucm.json,.suc.json,application/json" hidden />
      </div>
      ${state.textualMessage ? `<p class="textualMessage">${escapeHtml(state.textualMessage)}</p>` : ""}
      <p>${escapeHtml(state.jsonMessage)}</p>
    </div>`;
}

export function renderTextualNotationPanel() {
  return `
    <div class="notationPanel">
      <div class="textualActions">
        <button type="button" id="copySysmlV2">${icon("copy")} Copy SysML v2</button>
        <button type="button" id="exportSysmlV2">${icon("download")} Export .sysml</button>
      </div>
      ${state.textualMessage ? `<p class="textualMessage">${escapeHtml(state.textualMessage)}</p>` : ""}
      <pre>${escapeHtml(serializeSysmlV2(state.projectModel))}</pre>
    </div>`;
}

export function renderTextualWorkspace() {
  const content = state.activeTextualTab === "json"
    ? JSON.stringify(serializeDiagramJson(state.projectModel), null, 2)
    : serializeSysmlV2(state.projectModel);
  const actionBar = state.activeTextualTab === "json"
    ? `
        <div class="textualActions">
          <button type="button" id="saveModelFile">${icon("save")} Save Model</button>
          <button type="button" id="openModelFile">${icon("folder")} Open Model</button>
          <input type="file" id="modelFileInput" accept=".json,.ucm.json,.suc.json,application/json" hidden />
        </div>`
    : `
        <div class="textualActions">
          <button type="button" id="copySysmlV2">${icon("copy")} Copy SysML v2</button>
          <button type="button" id="exportSysmlV2">${icon("download")} Export .sysml</button>
        </div>`;
  return `
    <main class="textualWorkspaceGrid">
      <section class="panel textualWorkspacePanel">
        <div class="tabBar" role="tablist" aria-label="Textual serializations">
          <button type="button" id="diagramJsonTextTab" class="${state.activeTextualTab === "json" ? "active" : ""}">${icon("json")} Diagram JSON</button>
          <button type="button" id="sysmlV2TextTab" class="${state.activeTextualTab === "sysml" ? "active" : ""}">${icon("code")} SysML v2</button>
        </div>
        ${actionBar}
        ${state.textualMessage ? `<p class="textualMessage">${escapeHtml(state.textualMessage)}</p>` : ""}
        <div class="notationPanel"><pre>${escapeHtml(content)}</pre></div>
      </section>
    </main>`;
}
