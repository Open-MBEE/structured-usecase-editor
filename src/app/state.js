export const root = typeof document === "undefined" ? null : document.getElementById("root");

export const appVersion = "0.8.0";

export const state = {
  projectModel: null,
  specification: null,
  selectedNominalStep: 4,
  activeInspector: "document",
  jsonDraft: "",
  jsonMessage: "JSON mirrors the in-memory model.",
  activeWorkspace: "diagram",
  activeTextualTab: "sysml",
  textualMessage: "",
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
