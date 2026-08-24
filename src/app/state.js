export const root = document.getElementById("root");

export const state = {
  projectModel: null,
  specification: null,
  selectedNominalStep: 4,
  activeInspector: "document",
  jsonDraft: "",
  jsonMessage: "JSON mirrors the in-memory model.",
  activeWorkspace: "diagram",
  activeTextualTab: "dsl",
  pendingFocusStep: null,
  diagramDrag: null,
  connectionDrag: null,
  suppressNextNodeClick: false,
  pendingFocusDiagramName: false,
  editingDiagramLabelId: "",
  labelEditTimer: null,
  specOnlyNodeId: "",
  render: () => {}
};

export function setRenderCallback(render) {
  state.render = render;
}

export function render() {
  state.render();
}

export function scheduleRender() {
  setTimeout(() => state.render(), 0);
}
