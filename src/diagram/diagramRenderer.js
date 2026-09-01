// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { DIAGRAM_HEIGHT, DIAGRAM_WIDTH, relationshipKinds } from "../model/constants.js";
import { nodeKind, nodeLayout } from "../model/normalize.js";
import { allRelationships, findNode, selectedEdge, selectedNode, selectedUseCaseNode } from "../model/selectors.js";
import { escapeHtml, icon } from "../ui/dom.js";
import { nodeBoundaryPoint, nodeCenter } from "./geometry.js";

function wrapLabel(value, maxCharsPerLine = 18, maxLines = 3) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine || !current) {
      current = next;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/\.*$/, "")}...`;
  return visible;
}

export function edgePath(edge) {
  const source = findNode(edge.sourceId);
  const target = findNode(edge.targetId);
  if (!source || !target) return "";
  const sourceCenter = nodeCenter(source);
  const targetCenter = nodeCenter(target);
  const a = nodeBoundaryPoint(source, targetCenter);
  const b = nodeBoundaryPoint(target, sourceCenter);
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

export function renderDiagramEdge(edge) {
  const source = findNode(edge.sourceId);
  const target = findNode(edge.targetId);
  if (!source || !target) return "";
  const kind = relationshipKinds[edge.type] ?? relationshipKinds.association;
  const sourceCenter = nodeCenter(source);
  const targetCenter = nodeCenter(target);
  const a = nodeBoundaryPoint(source, targetCenter);
  const b = nodeBoundaryPoint(target, sourceCenter);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const selected = state.projectModel.selectedEdgeId === edge.id;
  return `
    <g class="diagramEdge ${selected ? "selected" : ""}" data-edge-id="${edge.id}">
      <path d="${edgePath(edge)}" marker-end="${kind.arrow ? "url(#arrowHead)" : ""}" ${kind.dashed ? 'stroke-dasharray="7 5"' : ""}></path>
      ${kind.lineLabel ? `<text x="${midX}" y="${midY - 8}" text-anchor="middle">${escapeHtml(kind.lineLabel)}</text>` : ""}
    </g>`;
}

export function renderDiagramLabel(node, x, y, width, centered = true) {
  if (state.editingDiagramLabelId === node.id) {
    return `
      <foreignObject x="${x - width / 2}" y="${y - 17}" width="${width}" height="34">
        <div xmlns="http://www.w3.org/1999/xhtml" class="diagramInlineEditor">
          <input data-diagram-label-input="${node.id}" value="${escapeHtml(node.name)}" />
        </div>
      </foreignObject>`;
  }

  const lines = nodeKind(node) === "usecase" ? wrapLabel(node.name, Math.max(10, Math.floor(width / 8))) : [node.name];
  const firstY = y - ((lines.length - 1) * 8) + 5;
  return `
    <text x="${x}" y="${firstY}" text-anchor="${centered ? "middle" : "start"}" data-node-label-id="${node.id}">
      ${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : 16}">${escapeHtml(line)}</tspan>`).join("")}
    </text>`;
}

export function renderActorNode(node) {
  const selected = state.projectModel.selectedNodeId === node.id;
  const layout = nodeLayout(node);
  const cx = layout.x + layout.width / 2;
  const headR = 16;
  const headY = layout.y + 20;
  const bodyTop = headY + headR;
  const bodyBottom = layout.y + layout.height - 32;
  const labelY = layout.y + layout.height + 14;
  return `
    <g class="diagramNode actorNode ${selected ? "selected" : ""}" data-node-id="${node.id}" transform="translate(0 0)">
      <circle cx="${cx}" cy="${headY}" r="${headR}"></circle>
      <path d="M ${cx} ${bodyTop} L ${cx} ${bodyBottom} M ${cx - 28} ${bodyTop + 18} L ${cx + 28} ${bodyTop + 18} M ${cx} ${bodyBottom} L ${cx - 28} ${layout.y + layout.height - 4} M ${cx} ${bodyBottom} L ${cx + 28} ${layout.y + layout.height - 4}"></path>
      ${renderDiagramLabel(node, cx, labelY, 130)}
    </g>`;
}

export function renderUseCaseNode(node) {
  const selected = state.projectModel.selectedNodeId === node.id;
  const layout = nodeLayout(node);
  const cx = layout.x + layout.width / 2;
  const cy = layout.y + layout.height / 2;
  const handles = selected
    ? [
      ["nw", layout.x, layout.y],
      ["ne", layout.x + layout.width, layout.y],
      ["sw", layout.x, layout.y + layout.height],
      ["se", layout.x + layout.width, layout.y + layout.height]
    ].map(([corner, x, y]) => `<rect class="resizeHandle ${corner}" data-resize-handle="${corner}" data-node-id="${node.id}" x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2"></rect>`).join("")
    : "";
  return `
    <g class="diagramNode useCaseNode ${selected ? "selected" : ""}" data-node-id="${node.id}">
      <ellipse cx="${cx}" cy="${cy}" rx="${layout.width / 2}" ry="${layout.height / 2}"></ellipse>
      ${renderDiagramLabel(node, cx, cy, Math.max(130, layout.width - 18))}
      ${handles}
    </g>`;
}

export function renderConnectionPreview() {
  if (!state.connectionDrag?.currentX || !state.connectionDrag?.currentY) return "";
  const source = findNode(state.connectionDrag.sourceId);
  if (!source) return "";
  const toward = { x: state.connectionDrag.currentX, y: state.connectionDrag.currentY };
  const start = nodeBoundaryPoint(source, toward);
  return `
    <g class="connectionPreview">
      <path d="M ${start.x} ${start.y} L ${toward.x} ${toward.y}" marker-end="url(#arrowHead)"></path>
    </g>`;
}

export function renderDiagram() {
  const selected = selectedNode();
  const selectedUseCase = nodeKind(selected) === "usecase" ? selected : selectedUseCaseNode();
  const connectSource = state.projectModel.connectSourceId
    ? findNode(state.projectModel.connectSourceId)
    : null;
  return `
    <section class="panel diagramPanel" aria-label="Simple use case diagram editor">
      <div class="diagramHeader">
        <h2>Use Case Diagram</h2>
      </div>
      <p class="mutedText">${state.projectModel.paletteTool === "actor" || state.projectModel.paletteTool === "usecase" ? `Click the diagram to drop a ${state.projectModel.paletteTool === "actor" ? "new actor" : "new use case"}.` : state.projectModel.connectKind ? `Connecting ${state.projectModel.connectKind}${connectSource ? ` from ${connectSource.name}` : ": click a source node, then a target node"}.` : "Click a label to rename. Double-click a use case bubble to edit its specification."}</p>
      <div class="diagramCanvasShell">
        <div class="diagramPalette" aria-label="Diagram drawing palette">
          <div class="paletteTitle">Drawing Palette</div>
          <button type="button" class="${state.projectModel.paletteTool === "select" ? "active" : ""}" data-palette-tool="select" title="Select">
            <span class="paletteGlyph">↖</span><span>Select</span>
          </button>
          <button type="button" class="${state.projectModel.paletteTool === "actor" ? "active" : ""}" data-palette-tool="actor" title="Actor">
            <span class="paletteActorGlyph"></span><span>Actor</span>
          </button>
          <button type="button" class="${state.projectModel.paletteTool === "usecase" ? "active" : ""}" data-palette-tool="usecase" title="Use Case">
            <span class="paletteUseCaseGlyph"></span><span>Use Case</span>
          </button>
          ${Object.keys(relationshipKinds).map((kind) => `
            <button type="button" class="${state.projectModel.connectKind === kind ? "active" : ""}" data-palette-relationship="${kind}" title="${kind}">
              <span class="paletteConnectorGlyph ${relationshipKinds[kind].dashed ? "dashed" : ""}"></span><span>${relationshipKinds[kind].label}</span>
            </button>
          `).join("")}
          <button type="button" id="deleteDiagramSelection" ${!selected && !selectedEdge() ? "disabled" : ""}>${icon("trash")} Delete</button>
        </div>
        <svg id="useCaseDiagramCanvas" viewBox="0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}" role="img" aria-label="Editable simple use case diagram">
          <defs>
            <pattern id="diagramGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d9e0ea" stroke-width="0.7" />
            </pattern>
            <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z"></path>
            </marker>
          </defs>
          <rect data-diagram-background="true" width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" fill="url(#diagramGrid)" />
          ${allRelationships().map(renderDiagramEdge).join("")}
          ${renderConnectionPreview()}
          ${state.projectModel.actors.map(renderActorNode).join("")}
          ${state.projectModel.useCases.map(renderUseCaseNode).join("")}
        </svg>
      </div>
      <div class="diagramInspector">
        <label>Selected Node Name
          <input id="selectedDiagramName" value="${escapeHtml(selected?.name ?? selectedEdge()?.type ?? "")}" ${selected ? "" : "disabled"} />
        </label>
        <button type="button" id="renameDiagramNode" ${selected ? "" : "disabled"}>Rename</button>
        <p>${selected ? `Editing diagram node: ${escapeHtml(selected.name)}.` : "Select a diagram node to rename it."} ${selectedUseCase ? `Specification target: ${escapeHtml(selectedUseCase.name)}.` : "Add a use case to enable the specification editor."}</p>
      </div>
    </section>`;
}
