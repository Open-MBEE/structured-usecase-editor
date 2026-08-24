// Extracted source module for the Structured Use Case Editor reference implementation.

import { render } from "../app/state.js";
import { state } from "../app/state.js";
import { DIAGRAM_HEIGHT, DIAGRAM_MARGIN, DIAGRAM_WIDTH, relationshipKinds } from "../model/constants.js";
import { createActorNode, createBlankSpecification, createUseCaseNode } from "../model/factories.js";
import { nodeKind, nodeLayout } from "../model/normalize.js";
import { allRelationships, findNode, nominal, selectedNode } from "../model/selectors.js";
import { syncJsonDraft } from "../serializers/jsonSerializer.js";
import { saveProjectSnapshot } from "../storage/storageService.js";
import { diagramPointFromEvent, nodeIdFromClientPoint } from "./geometry.js";

export function selectNode(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  state.projectModel.selectedNodeId = nodeId;
  state.projectModel.selectedEdgeId = "";
  if (nodeKind(node) === "usecase") {
    state.specification = node.specification;
    state.selectedNominalStep = nominal()?.steps[0]?.number ?? 1;
    state.activeInspector = "document";
    syncJsonDraft();
  }
}

export function addDiagramNode(kind) {
  const number = state.projectModel.nextNodeNumber++;
  if (kind === "actor") {
    const node = createActorNode(`actor${number}`, `Actor${number}`, 58 + number * 12, 92 + number * 8);
    state.projectModel.actors.push(node);
    selectNode(node.id);
  } else {
    const spec = createBlankSpecification();
    spec.name = `UseCase${number}`;
    const node = createUseCaseNode(`uc${number}`, spec.name, 210 + number * 10, 118 + number * 6, spec);
    state.projectModel.useCases.push(node);
    selectNode(node.id);
  }
  state.editingDiagramLabelId = state.projectModel.selectedNodeId;
  state.pendingFocusDiagramName = false;
  saveProjectSnapshot();
  render();
}

export function addDiagramNodeAt(kind, x, y) {
  const number = state.projectModel.nextNodeNumber++;
  if (kind === "actor") {
    const node = createActorNode(`actor${number}`, `Actor${number}`, x - 37, y - 58);
    state.projectModel.actors.push(node);
    selectNode(node.id);
  } else {
    const spec = createBlankSpecification();
    spec.name = `UseCase${number}`;
    const node = createUseCaseNode(`uc${number}`, spec.name, x - 75, y - 36, spec);
    state.projectModel.useCases.push(node);
    selectNode(node.id);
  }
  state.editingDiagramLabelId = state.projectModel.selectedNodeId;
  state.pendingFocusDiagramName = false;
  saveProjectSnapshot();
  render();
}

export function setPaletteTool(tool, relationshipKind = "") {
  state.projectModel.paletteTool = tool;
  state.projectModel.connectKind = relationshipKind;
  state.projectModel.connectSourceId = "";
  saveProjectSnapshot();
  render();
}

export function startDiagramConnection() {
  state.projectModel.connectKind = document.getElementById("relationshipKind")?.value || "association";
  state.projectModel.paletteTool = "relationship";
  state.projectModel.connectSourceId = "";
  state.projectModel.selectedEdgeId = "";
  render();
}

export function createDiagramRelationship(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId || !state.projectModel.connectKind) {
    return false;
  }

  state.projectModel.relationships.push({
    id: `edge${state.projectModel.nextEdgeNumber++}`,
    type: state.projectModel.connectKind,
    label: relationshipKinds[state.projectModel.connectKind]?.lineLabel ?? "",
    sourceId,
    targetId,
    layout: {}
  });
  state.projectModel.connectKind = "";
  state.projectModel.paletteTool = "select";
  state.projectModel.connectSourceId = "";
  state.projectModel.selectedNodeId = targetId;
  state.projectModel.selectedEdgeId = "";
  saveProjectSnapshot();
  return true;
}

export function handleDiagramNodeClick(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  if (state.suppressNextNodeClick) {
    state.suppressNextNodeClick = false;
    return;
  }

  if (state.projectModel.paletteTool === "relationship" && state.projectModel.connectKind) {
    if (!state.projectModel.connectSourceId) {
      state.projectModel.connectSourceId = nodeId;
      state.projectModel.selectedNodeId = nodeId;
      render();
      return;
    }

    if (createDiagramRelationship(state.projectModel.connectSourceId, nodeId)) {
      render();
      return;
    }
  }

  selectNode(nodeId);
  saveProjectSnapshot();
  render();
}

export function renameDiagramNode(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  const nextName = window.prompt("Rename diagram node", node.name);
  if (!nextName || !nextName.trim()) return;
  node.name = nextName.trim();
  if (nodeKind(node) === "usecase") {
    node.specification.name = node.name;
    if (state.projectModel.selectedNodeId === node.id) {
      state.specification = node.specification;
      syncJsonDraft();
    }
  }
  saveProjectSnapshot();
  render();
}

export function deleteDiagramSelection() {
  if (state.projectModel.selectedEdgeId) {
    state.projectModel.relationships = allRelationships().filter((edge) => edge.id !== state.projectModel.selectedEdgeId);
    state.projectModel.selectedEdgeId = "";
    saveProjectSnapshot();
    render();
    return;
  }

  const node = selectedNode();
  if (!node) return;
  state.projectModel.actors = state.projectModel.actors.filter((item) => item.id !== node.id);
  state.projectModel.useCases = state.projectModel.useCases.filter((item) => item.id !== node.id);
  state.projectModel.relationships = allRelationships().filter((edge) => edge.sourceId !== node.id && edge.targetId !== node.id);
  const nextUseCase = state.projectModel.useCases[0];
  if (nextUseCase) {
    selectNode(nextUseCase.id);
  } else {
    state.projectModel.selectedNodeId = state.projectModel.actors[0]?.id ?? "";
    state.specification = createBlankSpecification();
  }
  saveProjectSnapshot();
  render();
}

export function renameSelectedDiagramNode(name) {
  const node = selectedNode();
  if (!node) return;
  node.name = name;
  if (nodeKind(node) === "usecase") {
    node.specification.name = name;
    state.specification = node.specification;
    syncJsonDraft();
  }
  saveProjectSnapshot();
}

export function commitDiagramLabelEdit(nodeId, name) {
  const node = findNode(nodeId);
  if (!node) return;
  node.name = name.trim() || node.name;
  if (nodeKind(node) === "usecase") {
    node.specification.name = node.name;
    if (state.projectModel.selectedNodeId === node.id) {
      state.specification = node.specification;
      syncJsonDraft();
    }
  }
  state.editingDiagramLabelId = "";
  selectNode(node.id);
  saveProjectSnapshot();
  render();
}

export function startDiagramLabelEdit(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  if (state.labelEditTimer) {
    window.clearTimeout(state.labelEditTimer);
    state.labelEditTimer = null;
  }
  state.editingDiagramLabelId = node.id;
  selectNode(node.id);
  render();
}

function scheduleDiagramLabelEdit(nodeId) {
  if (state.labelEditTimer) {
    window.clearTimeout(state.labelEditTimer);
  }
  state.labelEditTimer = window.setTimeout(() => {
    state.labelEditTimer = null;
    startDiagramLabelEdit(nodeId);
  }, 180);
}

export function openSpecEditorTab(nodeId) {
  const node = state.projectModel.useCases.find((item) => item.id === nodeId);
  if (!node) return;
  selectNode(node.id);
  state.activeWorkspace = "specification";
  state.activeInspector = "document";
  saveProjectSnapshot();
  render();
}

function handleDiagramCanvasClick(svg, event) {
  if (event.target.closest("[data-node-id]") || event.target.closest("[data-edge-id]")) return;
  const point = diagramPointFromEvent(svg, event);
  if (state.projectModel.paletteTool === "actor" || state.projectModel.paletteTool === "usecase") {
    const nodeKind = state.projectModel.paletteTool;
    state.projectModel.paletteTool = "select";
    addDiagramNodeAt(nodeKind, point.x, point.y);
    return;
  }
  state.projectModel.selectedNodeId = "";
  state.projectModel.selectedEdgeId = "";
  state.projectModel.connectSourceId = "";
  saveProjectSnapshot();
  render();
}

export function installDiagramDragHandlers() {
  const svg = document.getElementById("useCaseDiagramCanvas");
  if (!svg) return;

  svg.querySelectorAll("[data-node-id]").forEach((element) => {
    element.addEventListener("mousedown", (event) => {
      const node = findNode(element.dataset.nodeId);
      if (!node) return;
      if (event.detail >= 2 && nodeKind(node) === "usecase") {
        event.preventDefault();
        event.stopPropagation();
        openSpecEditorTab(node.id);
        return;
      }
      if (state.projectModel.paletteTool === "relationship" && state.projectModel.connectKind && !state.projectModel.connectSourceId) {
        const point = diagramPointFromEvent(svg, event);
        state.connectionDrag = { sourceId: node.id, startX: point.x, startY: point.y, hasMoved: false };
        state.projectModel.connectSourceId = node.id;
        state.projectModel.selectedNodeId = node.id;
        state.projectModel.selectedEdgeId = "";
        event.preventDefault();
        return;
      }
      if (state.projectModel.paletteTool === "relationship") {
        return;
      }
      const layout = nodeLayout(node);
      const point = diagramPointFromEvent(svg, event);
      state.diagramDrag = { nodeId: node.id, dx: point.x - layout.x, dy: point.y - layout.y };
      event.preventDefault();
    });

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const node = findNode(element.dataset.nodeId);
      if (event.detail >= 2 && nodeKind(node) === "usecase") {
        openSpecEditorTab(node.id);
        return;
      }
      handleDiagramNodeClick(element.dataset.nodeId);
    });

    element.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      const node = findNode(element.dataset.nodeId);
      if (nodeKind(node) === "usecase") {
        openSpecEditorTab(node.id);
      }
    });
  });

  svg.querySelectorAll("[data-node-label-id]").forEach((element) => {
    element.addEventListener("mousedown", (event) => {
      if (state.projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
    });
    element.addEventListener("click", (event) => {
      if (state.projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
      scheduleDiagramLabelEdit(element.dataset.nodeLabelId);
    });
    element.addEventListener("dblclick", (event) => {
      if (state.projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
      if (state.labelEditTimer) {
        window.clearTimeout(state.labelEditTimer);
        state.labelEditTimer = null;
      }
      const node = findNode(element.dataset.nodeLabelId);
      if (nodeKind(node) === "usecase") {
        openSpecEditorTab(node.id);
        return;
      }
      startDiagramLabelEdit(element.dataset.nodeLabelId);
    });
  });

  svg.querySelectorAll("[data-edge-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      state.projectModel.selectedEdgeId = element.dataset.edgeId;
      state.projectModel.selectedNodeId = "";
      saveProjectSnapshot();
      render();
    });
  });

  svg.querySelector("[data-diagram-background]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    handleDiagramCanvasClick(svg, event);
  });

  svg.addEventListener("click", (event) => {
    handleDiagramCanvasClick(svg, event);
  });

  if (!window.__structuredUseCaseDiagramDragInstalled) {
    window.__structuredUseCaseDiagramDragInstalled = true;
    window.addEventListener("mousemove", (event) => {
      if (state.connectionDrag) {
        const activeSvg = document.getElementById("useCaseDiagramCanvas");
        if (!activeSvg) return;
        const point = diagramPointFromEvent(activeSvg, event);
        if (Math.abs(point.x - state.connectionDrag.startX) > 4 || Math.abs(point.y - state.connectionDrag.startY) > 4) {
          state.connectionDrag.hasMoved = true;
        }
        return;
      }
      if (!state.diagramDrag) return;
      const activeSvg = document.getElementById("useCaseDiagramCanvas");
      if (!activeSvg) return;
      const node = findNode(state.diagramDrag.nodeId);
      if (!node) return;
      const layout = nodeLayout(node);
      const point = diagramPointFromEvent(activeSvg, event);
      layout.x = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_WIDTH - layout.width - DIAGRAM_MARGIN, point.x - state.diagramDrag.dx));
      layout.y = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_HEIGHT - layout.height - DIAGRAM_MARGIN, point.y - state.diagramDrag.dy));
      render();
    });

    window.addEventListener("mouseup", (event) => {
      if (state.connectionDrag) {
        const targetId = nodeIdFromClientPoint(event);
        const shouldCreate = state.connectionDrag.hasMoved && targetId && targetId !== state.connectionDrag.sourceId;
        if (shouldCreate) {
          state.suppressNextNodeClick = true;
          createDiagramRelationship(state.connectionDrag.sourceId, targetId);
          state.connectionDrag = null;
          render();
          return;
        }
        state.connectionDrag = null;
      }
      if (state.diagramDrag) saveProjectSnapshot();
      state.diagramDrag = null;
    });
  }

  svg.addEventListener("mouseleave", (event) => {
    if (!state.diagramDrag) return;
    const point = diagramPointFromEvent(svg, event);
    const node = findNode(state.diagramDrag.nodeId);
    if (!node) return;
    const layout = nodeLayout(node);
    layout.x = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_WIDTH - layout.width - DIAGRAM_MARGIN, point.x - state.diagramDrag.dx));
    layout.y = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_HEIGHT - layout.height - DIAGRAM_MARGIN, point.y - state.diagramDrag.dy));
    saveProjectSnapshot();
    render();
  });
}
