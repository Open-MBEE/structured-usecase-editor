// Extracted source module for the Structured Use Case Editor reference implementation.

import { nodeKind, nodeLayout } from "../model/normalize.js";
import { DIAGRAM_HEIGHT, DIAGRAM_WIDTH } from "../model/constants.js";

export function nodeCenter(node) {
  const layout = nodeLayout(node);
  return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 };
}

export function nodeBoundaryPoint(node, toward) {
  const center = nodeCenter(node);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;

  if (nodeKind(node) === "usecase") {
    const layout = nodeLayout(node);
    const rx = layout.width / 2;
    const ry = layout.height / 2;
    const scale = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
    return { x: center.x + dx * scale, y: center.y + dy * scale };
  }

  const layout = nodeLayout(node);
  const halfW = layout.width / 2;
  const halfH = layout.height / 2;
  const scale = Math.min(Math.abs(halfW / dx) || Number.POSITIVE_INFINITY, Math.abs(halfH / dy) || Number.POSITIVE_INFINITY);
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

export function diagramPointFromEvent(svg, event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * DIAGRAM_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * DIAGRAM_HEIGHT
  };
}

export function nodeIdFromClientPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-node-id]")?.dataset.nodeId ?? "";
}
