import { setRenderCallback, state } from "./state.js";
import { createExampleProjectModel, createExampleSpecification } from "../model/factories.js";
import { selectedUseCaseNode } from "../model/selectors.js";
import { syncJsonDraft } from "../serializers/jsonSerializer.js";
import { loadProjectSnapshot } from "../storage/storageService.js";
import { render } from "../ui/appRenderer.js";

const specHashMatch = window.location.hash.match(/^#spec=([^&]+)/);

state.specOnlyNodeId = specHashMatch ? decodeURIComponent(specHashMatch[1]) : "";
state.projectModel = loadProjectSnapshot() ?? createExampleProjectModel();

if (state.specOnlyNodeId && state.projectModel.useCases.some((node) => node.id === state.specOnlyNodeId)) {
  state.projectModel.selectedNodeId = state.specOnlyNodeId;
}

state.specification = selectedUseCaseNode()?.specification ?? createExampleSpecification();
state.activeWorkspace = state.specOnlyNodeId ? "specification" : "diagram";

syncJsonDraft();
setRenderCallback(render);
render();
