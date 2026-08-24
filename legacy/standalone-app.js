const root = document.getElementById("root");

function createBlankSpecification() {
  return {
    name: "",
    preconditions: [],
    requirements: [],
    relatedTestCases: [],
    scenarios: [
      {
        id: "N",
        type: "nominal",
        postcondition: [],
        steps: [{ number: 1, text: "" }]
      }
    ]
  };
}

function createExampleSpecification() {
  return {
    name: "Withdraw Cash",
    preconditions: ["ATM is operational and customer is authenticated."],
    requirements: ["REQ-ATM-01", "REQ-ATM-02", "REQ-ATM-05"],
    relatedTestCases: ["TC-ATM-01", "TC-ATM-04"],
    scenarios: [
      {
        id: "N",
        type: "nominal",
        postcondition: ["Cash is dispensed and transaction is recorded."],
        steps: [
          { number: 1, text: "Customer inserts card." },
          { number: 2, text: "System reads card and validates." },
          { number: 3, text: "System prompts for PIN." },
          { number: 4, text: "System validates withdrawal request." },
          { number: 5, text: "System prompts for amount." },
          { number: 6, text: "Customer enters amount." },
          { number: 7, text: "System dispenses cash." },
          { number: 8, text: "System prints receipt and returns card." }
        ]
      },
      {
        id: "4A",
        type: "alternate",
        condition: "User presses Cancel",
        postcondition: ["Transaction is cancelled and card is returned."],
        branchStep: 4,
        rejoinStep: 8,
        steps: [
          { number: 1, text: "User presses Cancel." },
          { number: 2, text: "System cancels transaction." },
          { number: 3, text: "System ejects card." }
        ]
      },
      {
        id: "4E",
        type: "exception",
        condition: "Insufficient account balance",
        postcondition: ["No cash is dispensed and customer may enter a smaller amount."],
        branchStep: 4,
        rejoinStep: 5,
        steps: [
          { number: 1, text: "System displays insufficient funds message." },
          { number: 2, text: "System prompts for a smaller amount." }
        ]
      }
    ]
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createUseCaseNode(id, name, x, y, specification) {
  return {
    id,
    name,
    layout: { x, y, width: 150, height: 72 },
    specification
  };
}

function createActorNode(id, name, x, y) {
  return {
    id,
    name,
    layout: { x, y, width: 74, height: 116 }
  };
}

function createExampleProjectModel() {
  const withdrawSpec = createExampleSpecification();
  return {
    metaclass: "UseCaseModel",
    id: "model-atm-use-cases",
    name: "ATMUseCaseModel",
    nextNodeNumber: 6,
    nextEdgeNumber: 4,
    selectedNodeId: "uc1",
    selectedEdgeId: "",
    paletteTool: "select",
    connectKind: "",
    connectSourceId: "",
    actors: [
      createActorNode("actor1", "Customer", 42, 92),
    ],
    useCases: [
      createUseCaseNode("uc1", withdrawSpec.name, 218, 86, withdrawSpec),
      createUseCaseNode("uc2", "Validate PIN", 252, 232, {
        ...createBlankSpecification(),
        name: "Validate PIN"
      })
    ],
    relationships: [
      { id: "edge1", type: "association", label: "", sourceId: "actor1", targetId: "uc1", layout: {} },
      { id: "edge2", type: "include", label: "«include»", sourceId: "uc1", targetId: "uc2", layout: {} }
    ]
  };
}

function createBlankProjectModel() {
  const spec = createBlankSpecification();
  spec.name = "New Use Case";
  return {
    metaclass: "UseCaseModel",
    id: "model-new-use-cases",
    name: "NewUseCaseModel",
    nextNodeNumber: 3,
    nextEdgeNumber: 1,
    selectedNodeId: "uc1",
    selectedEdgeId: "",
    paletteTool: "select",
    connectKind: "",
    connectSourceId: "",
    actors: [
      createActorNode("actor1", "Actor1", 42, 112),
    ],
    useCases: [
      createUseCaseNode("uc1", "New Use Case", 228, 120, spec)
    ],
    relationships: [{ id: "edge1", type: "association", label: "", sourceId: "actor1", targetId: "uc1", layout: {} }]
  };
}

const relationshipKinds = {
  association: { label: "Association", lineLabel: "", dashed: false, arrow: true },
  include: { label: "Includes", lineLabel: "«include»", dashed: true, arrow: true },
  extend: { label: "Extends", lineLabel: "«extend»", dashed: true, arrow: true },
  invoke: { label: "Invokes", lineLabel: "«invoke»", dashed: false, arrow: true },
  precedes: { label: "Precedes", lineLabel: "«precede»", dashed: false, arrow: true }
};

const legacyRelationshipType = {
  Association: "association",
  Includes: "include",
  Extends: "extend",
  Invokes: "invoke",
  Precedes: "precedes"
};

const DIAGRAM_WIDTH = 1200;
const DIAGRAM_HEIGHT = 760;
const DIAGRAM_MARGIN = 10;

const specHashMatch = window.location.hash.match(/^#spec=([^&]+)/);
const specOnlyNodeId = specHashMatch ? decodeURIComponent(specHashMatch[1]) : "";
const storageKey = "structuredUseCaseProjectModel";

function saveProjectSnapshot() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(projectModel));
  } catch {
    // Local file storage can be unavailable in some browser settings.
  }
}

function loadProjectSnapshot() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? normalizeUseCaseModel(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

let projectModel = loadProjectSnapshot() ?? createExampleProjectModel();
if (specOnlyNodeId && allNodes().some((node) => node.id === specOnlyNodeId)) {
  projectModel.selectedNodeId = specOnlyNodeId;
}

function nodeKind(node) {
  return node?.specification ? "usecase" : "actor";
}

function nodeLayout(node) {
  if (!node.layout) {
    node.layout = {
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.w ?? (nodeKind(node) === "usecase" ? 150 : 74),
      height: node.h ?? (nodeKind(node) === "usecase" ? 72 : 116)
    };
  }
  return node.layout;
}

function allNodes() {
  return [...(projectModel.actors ?? []), ...(projectModel.useCases ?? [])];
}

function allRelationships() {
  return projectModel.relationships ?? [];
}

function findNode(id) {
  return allNodes().find((node) => node.id === id);
}

function normalizeUseCaseModel(model) {
  if (!model) return model;
  model.metaclass = model.metaclass ?? "UseCaseModel";
  model.id = model.id ?? "model-use-cases";
  model.name = model.name ?? "UseCaseModelInstance";

  if (model.nodes && !model.actors && !model.useCases) {
    model.actors = model.nodes
      .filter((node) => node.kind === "actor")
      .map((node) => createActorNode(node.id, node.name, node.x ?? node.layout?.x ?? 0, node.y ?? node.layout?.y ?? 0));
    model.useCases = model.nodes
      .filter((node) => node.kind === "usecase")
      .map((node) => createUseCaseNode(node.id, node.name, node.x ?? node.layout?.x ?? 0, node.y ?? node.layout?.y ?? 0, node.specification ?? createBlankSpecification()));
    delete model.nodes;
  }

  model.actors = model.actors ?? [];
  model.useCases = model.useCases ?? [];
  model.relationships = (model.relationships ?? model.edges ?? []).map((edge) => ({
    id: edge.id,
    type: legacyRelationshipType[edge.kind] ?? edge.type ?? "association",
    label: edge.label ?? relationshipKinds[legacyRelationshipType[edge.kind] ?? edge.type ?? "association"]?.lineLabel ?? "",
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    layout: edge.layout ?? {}
  }));
  delete model.edges;

  [...model.actors, ...model.useCases].forEach((node) => {
    if (!node.layout) {
      node.layout = {
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.w ?? (node.specification ? 150 : 74),
        height: node.h ?? (node.specification ? 72 : 116)
      };
    }
    delete node.x;
    delete node.y;
    delete node.w;
    delete node.h;
    delete node.kind;
  });
  return model;
}

function selectedUseCaseNode() {
  const selected = projectModel.useCases.find((node) => node.id === projectModel.selectedNodeId);
  if (selected) return selected;
  return projectModel.useCases[0];
}

let specification = selectedUseCaseNode()?.specification ?? createExampleSpecification();

let selectedNominalStep = 4;
let activeInspector = "document";
let jsonDraft = JSON.stringify(projectModel, null, 2);
let jsonMessage = "JSON mirrors the in-memory model.";
let activeWorkspace = specOnlyNodeId ? "specification" : "diagram";
let activeTextualTab = "dsl";
let pendingFocusStep = null;
let diagramDrag = null;
let connectionDrag = null;
let suppressNextNodeClick = false;
let pendingFocusDiagramName = false;
let editingDiagramLabelId = "";

const labels = {
  nominal: "Basic (Nominal) Scenario",
  alternate: "Alternate Scenario",
  exception: "Exception Scenario"
};

function syncJsonDraft() {
  jsonDraft = JSON.stringify(projectModel, null, 2);
}

function scenarioHeading(scenario) {
  if (scenario.type === "nominal") {
    return labels.nominal;
  }
  return `${labels[scenario.type]} ${scenario.id}${scenario.condition ? `: ${scenario.condition}` : ""}`;
}

function quoteNotation(value) {
  return `"${String(value ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function notationIdentifier(value, fallback) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
  return compact || fallback;
}

function icon(name) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6",
    up: "M12 19V5M5 12l7-7 7 7",
    down: "M12 5v14M5 12l7 7 7-7",
    branch: "M6 3v6a6 6 0 0 0 6 6h6M18 9v6h-6M6 21v-6",
    alert: "M12 3 2 21h20L12 3ZM12 9v5M12 18h.01",
    check: "M20 6 9 17l-5-5",
    doc: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h8",
    json: "M8 7 4 12l4 5M16 7l4 5-4 5",
    code: "M8 9 4 12l4 3M16 9l4 3-4 3M14 5l-4 14",
    help: "M9.1 9a3 3 0 1 1 5.8 1c-.7 1.1-1.9 1.5-2.4 2.5M12 17h.01",
    save: "M5 3h12l2 2v16H5zM8 3v6h8M8 21v-7h8v7",
    reset: "M3 12a9 9 0 1 0 3-6.7M3 3v6h6"
  };
  return `<svg class="miniIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"></path></svg>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseList(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function nominal() {
  return specification.scenarios.find((scenario) => scenario.type === "nominal");
}

function normalizeSteps(steps) {
  return steps.map((step, index) => ({ ...step, number: index + 1 }));
}

function formatStepNumber(scenario, step) {
  return scenario.type === "nominal" ? String(step.number) : `${scenario.id}.${step.number}`;
}

function offNominalForSelected(type) {
  return specification.scenarios.filter(
    (scenario) => scenario.type === type && scenario.branchStep === selectedNominalStep
  );
}

function setSpec(next) {
  specification = next;
  const useCase = selectedUseCaseNode();
  if (useCase) {
    useCase.specification = next;
    useCase.name = next.name || useCase.name;
  }
  syncJsonDraft();
  saveProjectSnapshot();
  render();
}

function selectNode(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  projectModel.selectedNodeId = nodeId;
  projectModel.selectedEdgeId = "";
  if (nodeKind(node) === "usecase") {
    specification = node.specification;
    selectedNominalStep = nominal()?.steps[0]?.number ?? 1;
    activeInspector = "document";
    syncJsonDraft();
  }
}

function selectedNode() {
  return findNode(projectModel.selectedNodeId);
}

function selectedEdge() {
  return allRelationships().find((edge) => edge.id === projectModel.selectedEdgeId);
}

function nodeCenter(node) {
  const layout = nodeLayout(node);
  return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 };
}

function nodeBoundaryPoint(node, toward) {
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

function scheduleRender() {
  saveProjectSnapshot();
  window.setTimeout(render, 0);
}

function updateScenario(id, updater) {
  setSpec({
    ...specification,
    scenarios: renumberOffNominalScenarios(
      specification.scenarios.map((scenario) => (scenario.id === id ? updater(scenario) : scenario))
    )
  });
}

function renumberOffNominalScenarios(scenarios) {
  const counts = new Map();

  return scenarios.map((scenario) => {
    if (scenario.type === "nominal" || scenario.branchStep === undefined) {
      return scenario;
    }

    const suffix = scenario.type === "alternate" ? "A" : "E";
    const key = `${scenario.branchStep}:${scenario.type}`;
    const nextCount = (counts.get(key) ?? 0) + 1;
    counts.set(key, nextCount);

    return {
      ...scenario,
      id: `${scenario.branchStep}${suffix}${nextCount > 1 ? nextCount : ""}`
    };
  });
}

function addStepToScenario(scenarioId, afterStepNumber) {
  const scenario = specification.scenarios.find((item) => item.id === scenarioId);
  if (!scenario) return;
  const insertIndex =
    afterStepNumber === undefined
      ? scenario.steps.length
      : Math.max(0, scenario.steps.findIndex((step) => step.number === afterStepNumber) + 1);
  const nextSteps = [...scenario.steps];
  nextSteps.splice(insertIndex, 0, { number: insertIndex + 1, text: "" });
  const normalizedSteps = normalizeSteps(nextSteps);
  const nextStepNumber = insertIndex + 1;

  pendingFocusStep = { scenarioId, stepNumber: nextStepNumber };
  if (scenario.type === "nominal") {
    selectedNominalStep = nextStepNumber;
  }

  setSpec({
    ...specification,
    scenarios: specification.scenarios.map((item) =>
      item.id === scenarioId ? { ...item, steps: normalizedSteps } : item
    )
  });
}

function makeScenarioId(type) {
  const suffix = type === "alternate" ? "A" : "E";
  const count = specification.scenarios.filter(
    (scenario) => scenario.type === type && scenario.branchStep === selectedNominalStep
  ).length;
  return `${selectedNominalStep}${suffix}${count ? count + 1 : ""}`;
}

function addNominalStep() {
  const base = nominal();
  if (!base) {
    setSpec({
      ...specification,
      scenarios: [
        {
          id: "N",
          type: "nominal",
          postcondition: [],
          steps: [{ number: 1, text: "" }]
        }
      ]
    });
    selectedNominalStep = 1;
    return;
  }
  addStepToScenario(base.id);
}

function deleteNominalStep() {
  const base = nominal();
  if (!base || base.steps.length <= 1) return;
  const deleted = selectedNominalStep;
  specification = {
    ...specification,
    scenarios: renumberOffNominalScenarios(specification.scenarios
      .filter((scenario) => scenario.type === "nominal" || scenario.branchStep !== deleted)
      .map((scenario) => {
        if (scenario.type === "nominal") {
          return { ...scenario, steps: normalizeSteps(scenario.steps.filter((step) => step.number !== deleted)) };
        }
        return {
          ...scenario,
          branchStep: scenario.branchStep > deleted ? scenario.branchStep - 1 : scenario.branchStep,
          rejoinStep:
            scenario.rejoinStep === deleted
              ? undefined
              : scenario.rejoinStep > deleted
                ? scenario.rejoinStep - 1
                : scenario.rejoinStep
        };
      }))
  };
  selectedNominalStep = Math.max(1, deleted - 1);
  render();
}

function moveNominalStep(direction) {
  const base = nominal();
  const index = base.steps.findIndex((step) => step.number === selectedNominalStep);
  const swapIndex = index + direction;
  if (swapIndex < 0 || swapIndex >= base.steps.length) return;
  const swapped = selectedNominalStep + direction;
  const remap = (stepNumber) => {
    if (stepNumber === selectedNominalStep) return swapped;
    if (stepNumber === swapped) return selectedNominalStep;
    return stepNumber;
  };
  specification = {
    ...specification,
    scenarios: renumberOffNominalScenarios(specification.scenarios.map((scenario) => {
      if (scenario.id === base.id) {
        const nextSteps = [...scenario.steps];
        [nextSteps[index], nextSteps[swapIndex]] = [nextSteps[swapIndex], nextSteps[index]];
        return { ...scenario, steps: normalizeSteps(nextSteps) };
      }
      return { ...scenario, branchStep: remap(scenario.branchStep), rejoinStep: remap(scenario.rejoinStep) };
    }))
  };
  selectedNominalStep = swapped;
  render();
}

function addOffNominal(type) {
  const exists = nominal()?.steps.some((step) => step.number === selectedNominalStep);
  if (!exists) return;
  setSpec({
    ...specification,
    scenarios: [
      ...specification.scenarios,
      {
        id: makeScenarioId(type),
        type,
        condition: type === "alternate" ? "New alternate condition" : "New exception condition",
        postcondition: [],
        branchStep: selectedNominalStep,
        steps: [{ number: 1, text: type === "alternate" ? "Describe alternate behavior." : "Describe exception handling." }]
      }
    ]
  });
}

function deleteScenario(id) {
  setSpec({
    ...specification,
    scenarios: renumberOffNominalScenarios(specification.scenarios.filter((scenario) => scenario.id !== id))
  });
}

function startBlankSpecification() {
  projectModel = createBlankProjectModel();
  specification = selectedUseCaseNode()?.specification ?? createBlankSpecification();
  selectedNominalStep = 1;
  activeWorkspace = "diagram";
  activeInspector = "document";
  syncJsonDraft();
  jsonMessage = "Blank UseCaseSpecification created.";
  saveProjectSnapshot();
  render();
}

function loadExampleSpecification() {
  projectModel = createExampleProjectModel();
  specification = selectedUseCaseNode()?.specification ?? createExampleSpecification();
  selectedNominalStep = 4;
  activeWorkspace = "diagram";
  activeInspector = "document";
  syncJsonDraft();
  jsonMessage = "Example UseCaseSpecification loaded.";
  saveProjectSnapshot();
  render();
}

function addDiagramNode(kind) {
  const number = projectModel.nextNodeNumber++;
  if (kind === "actor") {
    const node = createActorNode(`actor${number}`, `Actor${number}`, 58 + number * 12, 92 + number * 8);
    projectModel.actors.push(node);
    selectNode(node.id);
  } else {
    const spec = createBlankSpecification();
    spec.name = `UseCase${number}`;
    const node = createUseCaseNode(`uc${number}`, spec.name, 210 + number * 10, 118 + number * 6, spec);
    projectModel.useCases.push(node);
    selectNode(node.id);
  }
  editingDiagramLabelId = projectModel.selectedNodeId;
  pendingFocusDiagramName = false;
  saveProjectSnapshot();
  render();
}

function addDiagramNodeAt(kind, x, y) {
  const number = projectModel.nextNodeNumber++;
  if (kind === "actor") {
    const node = createActorNode(`actor${number}`, `Actor${number}`, x - 37, y - 58);
    projectModel.actors.push(node);
    selectNode(node.id);
  } else {
    const spec = createBlankSpecification();
    spec.name = `UseCase${number}`;
    const node = createUseCaseNode(`uc${number}`, spec.name, x - 75, y - 36, spec);
    projectModel.useCases.push(node);
    selectNode(node.id);
  }
  editingDiagramLabelId = projectModel.selectedNodeId;
  pendingFocusDiagramName = false;
  saveProjectSnapshot();
  render();
}

function setPaletteTool(tool, relationshipKind = "") {
  projectModel.paletteTool = tool;
  projectModel.connectKind = relationshipKind;
  projectModel.connectSourceId = "";
  saveProjectSnapshot();
  render();
}

function startDiagramConnection() {
  projectModel.connectKind = document.getElementById("relationshipKind")?.value || "association";
  projectModel.paletteTool = "relationship";
  projectModel.connectSourceId = "";
  projectModel.selectedEdgeId = "";
  render();
}

function createDiagramRelationship(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId || !projectModel.connectKind) {
    return false;
  }

  projectModel.relationships.push({
    id: `edge${projectModel.nextEdgeNumber++}`,
    type: projectModel.connectKind,
    label: relationshipKinds[projectModel.connectKind]?.lineLabel ?? "",
    sourceId,
    targetId,
    layout: {}
  });
  projectModel.connectKind = "";
  projectModel.paletteTool = "select";
  projectModel.connectSourceId = "";
  projectModel.selectedNodeId = targetId;
  projectModel.selectedEdgeId = "";
  saveProjectSnapshot();
  return true;
}

function handleDiagramNodeClick(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  if (suppressNextNodeClick) {
    suppressNextNodeClick = false;
    return;
  }

  if (projectModel.paletteTool === "relationship" && projectModel.connectKind) {
    if (!projectModel.connectSourceId) {
      projectModel.connectSourceId = nodeId;
      projectModel.selectedNodeId = nodeId;
      render();
      return;
    }

    if (createDiagramRelationship(projectModel.connectSourceId, nodeId)) {
      render();
      return;
    }
  }

  selectNode(nodeId);
  saveProjectSnapshot();
  render();
}

function renameDiagramNode(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  const nextName = window.prompt("Rename diagram node", node.name);
  if (!nextName || !nextName.trim()) return;
  node.name = nextName.trim();
  if (nodeKind(node) === "usecase") {
    node.specification.name = node.name;
    if (projectModel.selectedNodeId === node.id) {
      specification = node.specification;
      syncJsonDraft();
    }
  }
  saveProjectSnapshot();
  render();
}

function deleteDiagramSelection() {
  if (projectModel.selectedEdgeId) {
    projectModel.relationships = allRelationships().filter((edge) => edge.id !== projectModel.selectedEdgeId);
    projectModel.selectedEdgeId = "";
    saveProjectSnapshot();
    render();
    return;
  }

  const node = selectedNode();
  if (!node) return;
  projectModel.actors = projectModel.actors.filter((item) => item.id !== node.id);
  projectModel.useCases = projectModel.useCases.filter((item) => item.id !== node.id);
  projectModel.relationships = allRelationships().filter((edge) => edge.sourceId !== node.id && edge.targetId !== node.id);
  const nextUseCase = projectModel.useCases[0];
  if (nextUseCase) {
    selectNode(nextUseCase.id);
  } else {
    projectModel.selectedNodeId = projectModel.actors[0]?.id ?? "";
    specification = createBlankSpecification();
  }
  saveProjectSnapshot();
  render();
}

function renameSelectedDiagramNode(name) {
  const node = selectedNode();
  if (!node) return;
  node.name = name;
  if (nodeKind(node) === "usecase") {
    node.specification.name = name;
    specification = node.specification;
    syncJsonDraft();
  }
  saveProjectSnapshot();
}

function commitDiagramLabelEdit(nodeId, name) {
  const node = findNode(nodeId);
  if (!node) return;
  node.name = name.trim() || node.name;
  if (nodeKind(node) === "usecase") {
    node.specification.name = node.name;
    if (projectModel.selectedNodeId === node.id) {
      specification = node.specification;
      syncJsonDraft();
    }
  }
  editingDiagramLabelId = "";
  selectNode(node.id);
  saveProjectSnapshot();
  render();
}

function startDiagramLabelEdit(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  editingDiagramLabelId = node.id;
  selectNode(node.id);
  render();
}

function openSpecEditorTab(nodeId) {
  const node = projectModel.useCases.find((item) => item.id === nodeId);
  if (!node) return;
  selectNode(node.id);
  activeWorkspace = "specification";
  activeInspector = "document";
  saveProjectSnapshot();
  render();
}

function diagramPointFromEvent(svg, event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * DIAGRAM_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * DIAGRAM_HEIGHT
  };
}

function nodeIdFromClientPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-node-id]")?.dataset.nodeId ?? "";
}

function installDiagramDragHandlers() {
  const svg = document.getElementById("useCaseDiagramCanvas");
  if (!svg) return;

  svg.querySelectorAll("[data-node-id]").forEach((element) => {
    element.addEventListener("mousedown", (event) => {
      const node = findNode(element.dataset.nodeId);
      if (!node) return;
      if (projectModel.paletteTool === "relationship" && projectModel.connectKind && !projectModel.connectSourceId) {
        const point = diagramPointFromEvent(svg, event);
        connectionDrag = { sourceId: node.id, startX: point.x, startY: point.y, hasMoved: false };
        projectModel.connectSourceId = node.id;
        projectModel.selectedNodeId = node.id;
        projectModel.selectedEdgeId = "";
        event.preventDefault();
        return;
      }
      if (projectModel.paletteTool === "relationship") {
        return;
      }
      const layout = nodeLayout(node);
      const point = diagramPointFromEvent(svg, event);
      diagramDrag = { nodeId: node.id, dx: point.x - layout.x, dy: point.y - layout.y };
      event.preventDefault();
    });

    element.addEventListener("click", (event) => {
      event.stopPropagation();
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
      if (projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
    });
    element.addEventListener("click", (event) => {
      if (projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
      startDiagramLabelEdit(element.dataset.nodeLabelId);
    });
    element.addEventListener("dblclick", (event) => {
      if (projectModel.paletteTool === "relationship") return;
      event.preventDefault();
      event.stopPropagation();
      startDiagramLabelEdit(element.dataset.nodeLabelId);
    });
  });

  svg.querySelectorAll("[data-edge-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      projectModel.selectedEdgeId = element.dataset.edgeId;
      projectModel.selectedNodeId = "";
      saveProjectSnapshot();
      render();
    });
  });

  svg.addEventListener("click", (event) => {
    if (event.target.closest("[data-node-id]") || event.target.closest("[data-edge-id]")) return;
    const point = diagramPointFromEvent(svg, event);
    if (projectModel.paletteTool === "actor" || projectModel.paletteTool === "usecase") {
      const nodeKind = projectModel.paletteTool;
      projectModel.paletteTool = "select";
      addDiagramNodeAt(nodeKind, point.x, point.y);
      return;
    }
    projectModel.selectedNodeId = "";
    projectModel.selectedEdgeId = "";
    projectModel.connectSourceId = "";
    saveProjectSnapshot();
    render();
  });

  if (!window.__structuredUseCaseDiagramDragInstalled) {
    window.__structuredUseCaseDiagramDragInstalled = true;
    window.addEventListener("mousemove", (event) => {
      if (connectionDrag) {
        const activeSvg = document.getElementById("useCaseDiagramCanvas");
        if (!activeSvg) return;
        const point = diagramPointFromEvent(activeSvg, event);
        if (Math.abs(point.x - connectionDrag.startX) > 4 || Math.abs(point.y - connectionDrag.startY) > 4) {
          connectionDrag.hasMoved = true;
        }
        return;
      }
      if (!diagramDrag) return;
      const activeSvg = document.getElementById("useCaseDiagramCanvas");
      if (!activeSvg) return;
      const node = findNode(diagramDrag.nodeId);
      if (!node) return;
      const layout = nodeLayout(node);
      const point = diagramPointFromEvent(activeSvg, event);
      layout.x = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_WIDTH - layout.width - DIAGRAM_MARGIN, point.x - diagramDrag.dx));
      layout.y = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_HEIGHT - layout.height - DIAGRAM_MARGIN, point.y - diagramDrag.dy));
      render();
    });

    window.addEventListener("mouseup", (event) => {
      if (connectionDrag) {
        const targetId = nodeIdFromClientPoint(event);
        const shouldCreate = connectionDrag.hasMoved && targetId && targetId !== connectionDrag.sourceId;
        if (shouldCreate) {
          suppressNextNodeClick = true;
          createDiagramRelationship(connectionDrag.sourceId, targetId);
          connectionDrag = null;
          render();
          return;
        }
        connectionDrag = null;
      }
      if (diagramDrag) saveProjectSnapshot();
      diagramDrag = null;
    });
  }

  svg.addEventListener("mouseleave", (event) => {
    if (!diagramDrag) return;
    const point = diagramPointFromEvent(svg, event);
    const node = findNode(diagramDrag.nodeId);
    if (!node) return;
    const layout = nodeLayout(node);
    layout.x = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_WIDTH - layout.width - DIAGRAM_MARGIN, point.x - diagramDrag.dx));
    layout.y = Math.max(DIAGRAM_MARGIN, Math.min(DIAGRAM_HEIGHT - layout.height - DIAGRAM_MARGIN, point.y - diagramDrag.dy));
    saveProjectSnapshot();
    render();
  });
}

function renderScenario(scenario) {
  const isNominal = scenario.type === "nominal";
  const accent = scenario.type === "alternate" ? "alternate" : scenario.type === "exception" ? "exception" : "nominal";
  const nominalSteps = nominal()?.steps ?? [];
  const rows = scenario.steps
    .map(
      (step) => `
        <tr class="${selectedNominalStep === step.number && isNominal ? "selectedRow" : ""}" data-select-step="${isNominal ? step.number : ""}">
          <td>${formatStepNumber(scenario, step)}</td>
          <td><input aria-label="Action for step ${formatStepNumber(scenario, step)}" data-step-text="${scenario.id}:${step.number}" value="${escapeHtml(step.text)}" /></td>
          <td><button type="button" class="iconButton" data-delete-step="${scenario.id}:${step.number}" ${scenario.steps.length <= 1 ? "disabled" : ""}>${icon("trash")}</button></td>
        </tr>`
    )
    .join("");
  const rejoin = isNominal
    ? ""
    : `<tr class="rejoinRow"><td></td><td colspan="2">${scenario.rejoinStep ? `Return to Step ${scenario.rejoinStep}.` : "Use case ends."}</td></tr>`;

  return `
    <section class="panel scenarioPanel ${accent}">
      <div class="scenarioHeader">
        <div>
          <h2>${escapeHtml(scenarioHeading(scenario))}</h2>
          ${
            isNominal
              ? ""
              : `<div class="scenarioMetaGrid singleField">
                  <label>Condition<input data-scenario-condition="${scenario.id}" value="${escapeHtml(scenario.condition ?? "")}" /></label>
                </div>`
          }
        </div>
        <div class="scenarioActions">
          ${
            isNominal
              ? ""
              : `<label>Branch<select data-scenario-branch="${scenario.id}">
                  <option value="">Select</option>
                  ${nominalSteps.map((step) => `<option value="${step.number}" ${scenario.branchStep === step.number ? "selected" : ""}>Step ${step.number}</option>`).join("")}
                </select></label>
                <label>Rejoin<select data-scenario-rejoin="${scenario.id}">
                  <option value="">Use Case Ends</option>
                  ${nominalSteps.map((step) => `<option value="${step.number}" ${scenario.rejoinStep === step.number ? "selected" : ""}>Step ${step.number}</option>`).join("")}
                </select></label>`
          }
          <button type="button" class="iconTextButton" data-add-step="${scenario.id}">${icon("plus")} Step</button>
          ${isNominal ? "" : `<button type="button" class="iconButton dangerButton" data-delete-scenario="${scenario.id}">${icon("trash")}</button>`}
        </div>
      </div>
      <table class="stepTable">
        <thead><tr><th>Step #</th><th>Action</th><th></th></tr></thead>
        <tbody>${rows}${rejoin}</tbody>
      </table>
      <label class="postconditionField">Postcondition
        <textarea rows="2" data-postcondition="${scenario.id}">${escapeHtml((scenario.postcondition ?? []).join("\n"))}</textarea>
      </label>
    </section>`;
}

function renderDocument() {
  const base = nominal();
  const offNominal = specification.scenarios.filter((scenario) => scenario.type !== "nominal");
  const hasPreconditions = specification.preconditions.some((item) => item.trim());
  const hasRequirements = specification.requirements.some((item) => item.trim());
  return `
    <div class="documentPreview">
      <h2>Use Case: ${escapeHtml(specification.name || "Untitled")}</h2>
      <dl>
        <dt>Actor</dt><dd>Modeler</dd>
        ${hasPreconditions ? `<dt>Preconditions</dt><dd>${escapeHtml(specification.preconditions.join("; "))}</dd>` : ""}
        ${hasRequirements ? `<dt>Requirements</dt><dd>${escapeHtml(specification.requirements.join(", "))}</dd>` : ""}
      </dl>
      <h3>${escapeHtml(labels.nominal)}</h3>
      <ol>${(base?.steps ?? []).map((step) => `<li>${escapeHtml(step.text)}</li>`).join("")}</ol>
      ${base?.postcondition?.some((item) => item.trim()) ? `<p>Postcondition: ${escapeHtml(base.postcondition.join("; "))}</p>` : ""}
      ${offNominal
        .map(
          (scenario) => `
            <section class="generatedScenario">
              <h3>${escapeHtml(scenarioHeading(scenario))}</h3>
              <p>Branches from nominal Step ${scenario.branchStep ?? "not selected"}.</p>
              <ol>${scenario.steps.map((step) => `<li><strong>${formatStepNumber(scenario, step)}</strong> ${escapeHtml(step.text)}</li>`).join("")}</ol>
              <p class="${scenario.type === "exception" ? "exceptionText" : "alternateText"}">${scenario.rejoinStep ? `Returns to Step ${scenario.rejoinStep}.` : "Use case ends."}</p>
              ${(scenario.postcondition ?? []).some((item) => item.trim()) ? `<p>Postcondition: ${escapeHtml(scenario.postcondition.join("; "))}</p>` : ""}
            </section>`
        )
        .join("")}
    </div>`;
}

function renderJsonPanel() {
  return `
    <div class="jsonPanel">
      <textarea id="jsonDraft">${escapeHtml(jsonDraft)}</textarea>
      <div class="jsonActions">
        <button type="button" id="refreshJson">Refresh</button>
        <button type="button" class="primaryButton" id="loadJson">Load JSON</button>
      </div>
      <p>${escapeHtml(jsonMessage)}</p>
    </div>`;
}

function serializeDiagramJson(model) {
  return {
    metaclass: "UseCaseDiagramSet",
    id: `${model.id ?? "model-use-cases"}-diagrams`,
    name: `${model.name ?? "UseCaseModelInstance"} Diagrams`,
    modelId: model.id ?? "model-use-cases",
    diagrams: [
      {
        id: "diagram-main",
        name: "Use Case Diagram",
        nodeViews: [
          ...(model.actors ?? []).map((actor) => ({
            id: `view-${actor.id}`,
            elementId: actor.id,
            elementType: "actor",
            layout: clone(nodeLayout(actor))
          })),
          ...(model.useCases ?? []).map((useCase) => ({
            id: `view-${useCase.id}`,
            elementId: useCase.id,
            elementType: "useCase",
            layout: clone(nodeLayout(useCase))
          }))
        ],
        relationshipViews: (model.relationships ?? []).map((relationship) => ({
          id: `view-${relationship.id}`,
          relationshipId: relationship.id,
          waypoints: relationship.layout?.waypoints ?? [],
          labelPosition: relationship.layout?.labelPosition ?? null
        }))
      }
    ]
  };
}

function slugId(value, fallback) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function stepStableId(useCase, scenario, step) {
  return step.id || `step-${useCase.id}-${scenario.id}-${slugId(step.text, `step-${step.number}`)}`;
}

function basicScenarioOf(useCase) {
  return useCase.specification?.scenarios?.find((scenario) => scenario.type === "nominal" || scenario.type === "basic");
}

function basicStepAt(useCase, stepNumber) {
  return basicScenarioOf(useCase)?.steps?.find((step) => step.number === stepNumber);
}

function branchStepIdFor(useCase, scenario) {
  if (scenario.branchStepId) return scenario.branchStepId;
  const branchStep = basicStepAt(useCase, scenario.branchStep);
  return branchStep ? stepStableId(useCase, basicScenarioOf(useCase), branchStep) : null;
}

function rejoinStepIdFor(useCase, scenario) {
  if (scenario.rejoinStepId) return scenario.rejoinStepId;
  const rejoinStep = basicStepAt(useCase, scenario.rejoinStep);
  return rejoinStep ? stepStableId(useCase, basicScenarioOf(useCase), rejoinStep) : null;
}

function scenarioDslType(scenario) {
  return scenario.type === "nominal" ? "basic" : scenario.type;
}

function scenarioBranchNumber(useCase, scenario) {
  if (scenario.branchStep) return scenario.branchStep;
  const branchStepId = branchStepIdFor(useCase, scenario);
  const base = basicScenarioOf(useCase);
  const index = base?.steps?.findIndex((step) => stepStableId(useCase, base, step) === branchStepId) ?? -1;
  return index >= 0 ? index + 1 : null;
}

function scenarioDslLabel(useCase, scenario) {
  const type = scenarioDslType(scenario);
  if (type === "basic") return "basic";
  const branchNumber = scenarioBranchNumber(useCase, scenario) ?? "unresolved";
  const sameBranch = (useCase.specification?.scenarios ?? []).filter(
    (item) => scenarioDslType(item) === type && scenarioBranchNumber(useCase, item) === branchNumber
  );
  const index = Math.max(0, sameBranch.findIndex((item) => item === scenario));
  const startCode = type === "alternate" ? "A".charCodeAt(0) : "E".charCodeAt(0);
  return `${branchNumber}${String.fromCharCode(startCode + index)}`;
}

function primaryActorIdFor(useCase) {
  if (useCase.specification?.primaryActorId) return useCase.specification.primaryActorId;
  const relationship = allRelationships().find((item) => {
    const source = findNode(item.sourceId);
    const target = findNode(item.targetId);
    return item.type === "association" &&
      ((source && nodeKind(source) === "actor" && item.targetId === useCase.id) ||
        (target && nodeKind(target) === "actor" && item.sourceId === useCase.id));
  });
  if (!relationship) return null;
  const source = findNode(relationship.sourceId);
  return nodeKind(source) === "actor" ? relationship.sourceId : relationship.targetId;
}

function pushStringBlock(lines, name, values, indent) {
  const populated = (values ?? []).filter((item) => item.trim());
  if (!populated.length) return;
  lines.push(`${indent}${name} {`);
  populated.forEach((value) => lines.push(`${indent}  ${quoteNotation(value)};`));
  lines.push(`${indent}}`);
  lines.push("");
}

function serializeUseCaseDsl(model) {
  const lines = [`model ${notationIdentifier(model.name, "useCaseModel")} {`, ""];

  (model.actors ?? []).forEach((actor) => {
    lines.push(`  actor ${notationIdentifier(actor.name, actor.id)} {`);
    lines.push(`    id: ${quoteNotation(actor.id)};`);
    lines.push(`    name: ${quoteNotation(actor.name)};`);
    lines.push("  }");
    lines.push("");
  });

  (model.useCases ?? []).forEach((useCase) => {
    const spec = useCase.specification ?? createBlankSpecification();
    lines.push(`  use case ${quoteNotation(useCase.name || "Untitled Use Case")} {`);
    lines.push(`    id: ${quoteNotation(useCase.id)};`);
    lines.push("");
    lines.push("    specification {");

    const primaryActorId = primaryActorIdFor(useCase);
    if (primaryActorId) {
      lines.push(`      primaryActorId: ${quoteNotation(primaryActorId)};`);
      lines.push("");
    }

    pushStringBlock(lines, "requirements", spec.requirements, "      ");
    pushStringBlock(lines, "relatedTestCases", spec.relatedTestCases, "      ");
    pushStringBlock(lines, "preconditions", spec.preconditions, "      ");

    (spec.scenarios ?? []).forEach((scenario) => {
      const type = scenarioDslType(scenario);
      const label = scenarioDslLabel(useCase, scenario);
      lines.push(type === "basic" ? "      scenario basic {" : `      scenario ${type} ${label} {`);

      if (type !== "basic") {
        const branchStepId = branchStepIdFor(useCase, scenario);
        if (branchStepId) lines.push(`        branchStepId: ${quoteNotation(branchStepId)};`);
        if (scenario.condition?.trim()) lines.push(`        condition: ${quoteNotation(scenario.condition)};`);
        const rejoinStepId = rejoinStepIdFor(useCase, scenario);
        if (rejoinStepId) lines.push(`        rejoinStepId: ${quoteNotation(rejoinStepId)};`);
        const endsUseCase = scenario.endsUseCase ?? !rejoinStepId;
        lines.push(`        endsUseCase: ${endsUseCase ? "true" : "false"};`);
        lines.push("");
      }

      (scenario.steps ?? []).forEach((step, index) => {
        const displayedStep = type === "basic" ? String(index + 1) : `${label}.${index + 1}`;
        lines.push(`        step ${displayedStep} {`);
        lines.push(`          id: ${quoteNotation(stepStableId(useCase, scenario, step))};`);
        lines.push(`          text: ${quoteNotation(step.text)};`);
        lines.push("        }");
        lines.push("");
      });

      const postconditions = scenario.postconditions ?? scenario.postcondition ?? [];
      const populatedPostconditions = postconditions.filter((item) => item.trim());
      if (populatedPostconditions.length) {
        lines.push("        postconditions {");
        populatedPostconditions.forEach((postcondition) => lines.push(`          ${quoteNotation(postcondition)};`));
        lines.push("        }");
      }

      lines.push("      }");
      lines.push("");
    });

    lines.push("    }");
    lines.push("  }");
    lines.push("");
  });

  (model.relationships ?? []).forEach((relationship) => {
    lines.push(`  ${relationship.type} ${quoteNotation(relationship.label || relationship.id)} {`);
    lines.push(`    id: ${quoteNotation(relationship.id)};`);
    lines.push(`    sourceId: ${quoteNotation(relationship.sourceId)};`);
    lines.push(`    targetId: ${quoteNotation(relationship.targetId)};`);
    lines.push("  }");
    lines.push("");
  });

  lines.push("}");
  return lines.join("\n");
}

function renderNotationList(name, values, indent) {
  const populated = values.filter((item) => item.trim());
  if (!populated.length) return [];
  return [`${indent}attribute ${name} : String[*] = (${populated.map(quoteNotation).join(", ")});`];
}

function renderNotationScenario(scenario, indent) {
  const typeTag = scenario.type === "nominal" ? "nominal" : scenario.type;
  const lines = [
    `${indent}scenario ${typeTag} '${scenario.id}' {`,
    `${indent}  @kernel::Scenario { type = ${quoteNotation(scenario.type)}; label = ${quoteNotation(scenarioHeading(scenario))}; }`
  ];

  if (scenario.condition?.trim()) {
    lines.push(`${indent}  condition ${quoteNotation(scenario.condition)};`);
  }

  if (scenario.type !== "nominal") {
    lines.push(`${indent}  branchStep = stepRef(${scenario.branchStep ?? "unresolved"});`);
    lines.push(
      scenario.rejoinStep
        ? `${indent}  rejoinStep = stepRef(${scenario.rejoinStep});`
        : `${indent}  rejoinStep = useCaseEnd;`
    );
  }

  scenario.steps.forEach((step) => {
    lines.push(`${indent}  step ${formatStepNumber(scenario, step)} {`);
    lines.push(`${indent}    @kernel::Step { number = ${step.number}; }`);
    lines.push(`${indent}    action ${quoteNotation(step.text)};`);
    lines.push(`${indent}  }`);
  });

  (scenario.postcondition ?? [])
    .filter((item) => item.trim())
    .forEach((postcondition, index) => {
      lines.push(`${indent}  postcondition p${index + 1} = ${quoteNotation(postcondition)};`);
    });

  lines.push(`${indent}}`);
  return lines;
}

function generateTextualNotation() {
  const useCaseName = specification.name.trim() || "Untitled Use Case";
  const useCaseId = notationIdentifier(useCaseName, "untitledUseCase");
  const base = nominal();
  const offNominal = specification.scenarios.filter((scenario) => scenario.type !== "nominal");
  const lines = [
    "package UseCaseSpecifications {",
    `  use case def ${useCaseId} {`,
    `    @kernel::UseCaseSpecification { name = ${quoteNotation(useCaseName)}; }`
  ];

  lines.push(...renderNotationList("preconditions", specification.preconditions, "    "));
  lines.push(...renderNotationList("requirements", specification.requirements, "    "));
  lines.push(...renderNotationList("relatedTestCases", specification.relatedTestCases, "    "));

  if (base) {
    lines.push("");
    lines.push(...renderNotationScenario(base, "    "));
  }

  offNominal.forEach((scenario) => {
    lines.push("");
    lines.push(...renderNotationScenario(scenario, "    "));
  });

  lines.push("  }");
  lines.push("}");
  return lines.join("\n");
}

function renderTextualNotationPanel() {
  return `<div class="notationPanel"><pre>${escapeHtml(serializeUseCaseDsl(projectModel))}</pre></div>`;
}

function edgePath(edge) {
  const source = findNode(edge.sourceId);
  const target = findNode(edge.targetId);
  if (!source || !target) return "";
  const sourceCenter = nodeCenter(source);
  const targetCenter = nodeCenter(target);
  const a = nodeBoundaryPoint(source, targetCenter);
  const b = nodeBoundaryPoint(target, sourceCenter);
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

function renderDiagramEdge(edge) {
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
  const selected = projectModel.selectedEdgeId === edge.id;
  return `
    <g class="diagramEdge ${selected ? "selected" : ""}" data-edge-id="${edge.id}">
      <path d="${edgePath(edge)}" marker-end="${kind.arrow ? "url(#arrowHead)" : ""}" ${kind.dashed ? 'stroke-dasharray="7 5"' : ""}></path>
      ${kind.lineLabel ? `<text x="${midX}" y="${midY - 8}" text-anchor="middle">${escapeHtml(kind.lineLabel)}</text>` : ""}
    </g>`;
}

function renderDiagramLabel(node, x, y, width, centered = true) {
  if (editingDiagramLabelId === node.id) {
    return `
      <foreignObject x="${x - width / 2}" y="${y - 17}" width="${width}" height="34">
        <div xmlns="http://www.w3.org/1999/xhtml" class="diagramInlineEditor">
          <input data-diagram-label-input="${node.id}" value="${escapeHtml(node.name)}" />
        </div>
      </foreignObject>`;
  }

  return `<text x="${x}" y="${y + 5}" text-anchor="${centered ? "middle" : "start"}" data-node-label-id="${node.id}">${escapeHtml(node.name)}</text>`;
}

function renderActorNode(node) {
  const selected = projectModel.selectedNodeId === node.id;
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

function renderUseCaseNode(node) {
  const selected = projectModel.selectedNodeId === node.id;
  const layout = nodeLayout(node);
  const cx = layout.x + layout.width / 2;
  const cy = layout.y + layout.height / 2;
  return `
    <g class="diagramNode useCaseNode ${selected ? "selected" : ""}" data-node-id="${node.id}">
      <ellipse cx="${cx}" cy="${cy}" rx="${layout.width / 2}" ry="${layout.height / 2}"></ellipse>
      ${renderDiagramLabel(node, cx, cy, Math.max(130, layout.width - 18))}
    </g>`;
}

function renderDiagram() {
  const selected = selectedNode();
  const selectedUseCase = nodeKind(selected) === "usecase" ? selected : selectedUseCaseNode();
  const connectSource = projectModel.connectSourceId
    ? findNode(projectModel.connectSourceId)
    : null;
  return `
    <section class="panel diagramPanel" aria-label="Simple use case diagram editor">
      <div class="diagramHeader">
        <h2>Use Case Diagram</h2>
      </div>
      <p class="mutedText">${projectModel.paletteTool === "actor" || projectModel.paletteTool === "usecase" ? `Click the diagram to drop a ${projectModel.paletteTool === "actor" ? "new actor" : "new use case"}.` : projectModel.connectKind ? `Connecting ${projectModel.connectKind}${connectSource ? ` from ${connectSource.name}` : ": click a source node, then a target node"}.` : "Click a label to rename. Double-click a use case bubble to edit its specification."}</p>
      <div class="diagramCanvasShell">
        <div class="diagramPalette" aria-label="Diagram drawing palette">
          <div class="paletteTitle">Drawing Palette</div>
          <button type="button" class="${projectModel.paletteTool === "select" ? "active" : ""}" data-palette-tool="select" title="Select">
            <span class="paletteGlyph">↖</span><span>Select</span>
          </button>
          <button type="button" class="${projectModel.paletteTool === "actor" ? "active" : ""}" data-palette-tool="actor" title="Actor">
            <span class="paletteActorGlyph"></span><span>Actor</span>
          </button>
          <button type="button" class="${projectModel.paletteTool === "usecase" ? "active" : ""}" data-palette-tool="usecase" title="Use Case">
            <span class="paletteUseCaseGlyph"></span><span>Use Case</span>
          </button>
          ${Object.keys(relationshipKinds).map((kind) => `
            <button type="button" class="${projectModel.connectKind === kind ? "active" : ""}" data-palette-relationship="${kind}" title="${kind}">
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
          <rect width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" fill="url(#diagramGrid)" />
          ${allRelationships().map(renderDiagramEdge).join("")}
          ${projectModel.actors.map(renderActorNode).join("")}
          ${projectModel.useCases.map(renderUseCaseNode).join("")}
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

function renderEditorColumn(base, stepAlternates, stepExceptions, selectedStepExists, includeRelatedTestCases = false) {
  return `
    <section class="editorColumn">
      <section class="panel specificationPanel">
        <div class="formGrid">
          <label>Name<input id="specName" value="${escapeHtml(specification.name)}" /></label>
          <label>Requirements<input id="requirements" value="${escapeHtml(specification.requirements.join(", "))}" /></label>
          ${includeRelatedTestCases ? `<label>Related Test Cases<input id="relatedTestCases" value="${escapeHtml(specification.relatedTestCases.join(", "))}" /></label>` : ""}
          <label class="wideField">Preconditions<textarea id="preconditions" rows="2">${escapeHtml(specification.preconditions.join("\n"))}</textarea></label>
        </div>
      </section>
      <section class="panel toolbarPanel">
        <button type="button" id="addNominalStep">${icon("plus")} Add Step</button>
        <button type="button" id="deleteNominalStep" ${!base || base.steps.length <= 1 ? "disabled" : ""}>${icon("trash")} Delete</button>
        <button type="button" id="moveUp" ${selectedNominalStep <= 1 ? "disabled" : ""}>${icon("up")} Move Up</button>
        <button type="button" id="moveDown" ${!base || selectedNominalStep >= base.steps.length ? "disabled" : ""}>${icon("down")} Move Down</button>
        <button type="button" id="addAlternate" ${!selectedStepExists ? "disabled" : ""}>${icon("plus")} Add Alternate Scenario</button>
        <button type="button" id="addException" ${!selectedStepExists ? "disabled" : ""}>${icon("plus")} Add Exception Scenario</button>
      </section>
      ${base ? renderScenario(base) : ""}
      <section class="scenarioBand alternateBand">
        <div class="bandHeader"><h2>Alternate Scenarios for Step ${selectedNominalStep}</h2><span>${stepAlternates.length}</span></div>
        ${stepAlternates.length ? stepAlternates.map(renderScenario).join("") : '<p class="emptyState">No alternate scenarios branch from this nominal step.</p>'}
      </section>
      <section class="scenarioBand exceptionBand">
        <div class="bandHeader"><h2>Exception Scenarios for Step ${selectedNominalStep}</h2><span>${stepExceptions.length}</span></div>
        ${stepExceptions.length ? stepExceptions.map(renderScenario).join("") : '<p class="emptyState">No exception scenarios branch from this nominal step.</p>'}
      </section>
    </section>`;
}

function renderInspectorAside() {
  return `
    <aside class="rightRail">
      <section class="panel">
        <div class="tabBar" role="tablist" aria-label="Inspector panels">
          <button type="button" id="documentTab" class="${activeInspector === "document" ? "active" : ""}">${icon("doc")} Document</button>
          <button type="button" id="jsonTab" class="${activeInspector === "json" ? "active" : ""}">${icon("json")} JSON</button>
          <button type="button" id="notationTab" class="${activeInspector === "notation" ? "active" : ""}">${icon("code")} Textual Notation</button>
        </div>
        ${activeInspector === "document" ? renderDocument() : activeInspector === "json" ? renderJsonPanel() : renderTextualNotationPanel()}
      </section>
      <section class="buttonRow">
        <button type="button">${icon("help")} Help</button>
        <button type="button" class="primaryButton" id="applyModel">${icon("save")} Apply</button>
      </section>
    </aside>`;
}

function renderWorkspaceTabs() {
  const selectedUseCase = selectedUseCaseNode();
  return `
    <nav class="workspaceTabs" aria-label="Editor workspaces">
      <button type="button" id="diagramWorkspaceTab" class="${activeWorkspace === "diagram" ? "active" : ""}">
        ${icon("branch")} Diagram Editor
      </button>
      <button type="button" id="specWorkspaceTab" class="${activeWorkspace === "specification" ? "active" : ""}" ${selectedUseCase ? "" : "disabled"}>
        ${icon("doc")} Specification Editor${selectedUseCase ? `: ${escapeHtml(selectedUseCase.name || "Untitled")}` : ""}
      </button>
      <button type="button" id="textualWorkspaceTab" class="${activeWorkspace === "textual" ? "active" : ""}">
        ${icon("code")} Textual View
      </button>
    </nav>`;
}

function renderDiagramWorkspace() {
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
            <label>Related Test Cases<input id="relatedTestCases" value="${escapeHtml(specification.relatedTestCases.join(", "))}" /></label>
          </div>
        </section>
        ${renderInspectorAside()}
      </aside>
    </main>`;
}

function renderSpecificationWorkspace(base, stepAlternates, stepExceptions, selectedStepExists) {
  return `
    <main class="specWorkspaceGrid">
      ${renderEditorColumn(base, stepAlternates, stepExceptions, selectedStepExists, true)}
      ${renderInspectorAside()}
    </main>`;
}

function renderTextualWorkspace() {
  const content = activeTextualTab === "json"
    ? JSON.stringify(serializeDiagramJson(projectModel), null, 2)
    : serializeUseCaseDsl(projectModel);
  return `
    <main class="textualWorkspaceGrid">
      <section class="panel textualWorkspacePanel">
        <div class="tabBar" role="tablist" aria-label="Textual serializations">
          <button type="button" id="diagramJsonTextTab" class="${activeTextualTab === "json" ? "active" : ""}">${icon("json")} Diagram JSON</button>
          <button type="button" id="useCaseDslTextTab" class="${activeTextualTab === "dsl" ? "active" : ""}">${icon("code")} UCML</button>
        </div>
        <div class="notationPanel"><pre>${escapeHtml(content)}</pre></div>
      </section>
    </main>`;
}

function render() {
  const base = nominal();
  const stepAlternates = offNominalForSelected("alternate");
  const stepExceptions = offNominalForSelected("exception");
  const selectedStepExists = Boolean(base?.steps.some((step) => step.number === selectedNominalStep));

  if (specOnlyNodeId) {
    const node = selectedUseCaseNode();
    root.innerHTML = `
      <div class="appShell specOnlyShell">
        <header class="topBar">
          <div class="brandMark">${icon("branch")}</div>
          <div>
            <h1>Structured Use Case Editor</h1>
            <p>Specification tab for ${escapeHtml(node?.name ?? "selected use case")}.</p>
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

    bindEvents();
    return;
  }

  root.innerHTML = `
    <div class="appShell">
      <header class="topBar">
        <div class="brandMark">${icon("branch")}</div>
        <div>
          <h1>Structured Use Case Editor</h1>
          <p>Reference editor for creating structured use case diagrams and specifications.</p>
        </div>
        <div class="topActions">
          <button type="button" id="newBlank">${icon("plus")} New Blank</button>
          <button type="button" id="loadExample">${icon("reset")} Load Example</button>
        </div>
      </header>
      ${renderWorkspaceTabs()}
      ${activeWorkspace === "diagram"
        ? renderDiagramWorkspace()
        : activeWorkspace === "specification"
          ? renderSpecificationWorkspace(base, stepAlternates, stepExceptions, selectedStepExists)
          : renderTextualWorkspace()}
    </div>`;

  bindEvents();
}

function bindEvents() {
  const bind = (selector, event, handler) => {
    const element = document.querySelector(selector);
    if (element) element.addEventListener(event, handler);
  };
  const updateJsonDraft = () => {
    syncJsonDraft();
    saveProjectSnapshot();
  };

  bind("#newBlank", "click", startBlankSpecification);
  bind("#loadExample", "click", loadExampleSpecification);
  bind("#diagramWorkspaceTab", "click", () => {
    activeWorkspace = "diagram";
    saveProjectSnapshot();
    render();
  });
  bind("#specWorkspaceTab", "click", () => {
    if (!selectedUseCaseNode()) return;
    activeWorkspace = "specification";
    saveProjectSnapshot();
    render();
  });
  bind("#textualWorkspaceTab", "click", () => {
    activeWorkspace = "textual";
    saveProjectSnapshot();
    render();
  });
  bind("#diagramJsonTextTab", "click", () => {
    activeTextualTab = "json";
    render();
  });
  bind("#useCaseDslTextTab", "click", () => {
    activeTextualTab = "dsl";
    render();
  });
  bind("#deleteDiagramSelection", "click", deleteDiagramSelection);
  bind("#selectedDiagramName", "input", (event) => {
    renameSelectedDiagramNode(event.target.value);
  });
  bind("#selectedDiagramName", "blur", scheduleRender);
  bind("#renameDiagramNode", "click", () => {
    const input = document.getElementById("selectedDiagramName");
    if (input && !input.disabled) {
      input.focus();
      input.select();
    }
  });
  bind("#specName", "input", (event) => {
    specification.name = event.target.value;
    const useCase = selectedUseCaseNode();
    if (useCase) useCase.name = event.target.value || useCase.name;
    updateJsonDraft();
  });
  bind("#specName", "blur", scheduleRender);
  bind("#requirements", "input", (event) => {
    specification.requirements = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#requirements", "blur", scheduleRender);
  bind("#preconditions", "input", (event) => {
    specification.preconditions = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#preconditions", "blur", scheduleRender);
  bind("#relatedTestCases", "input", (event) => {
    specification.relatedTestCases = parseList(event.target.value);
    updateJsonDraft();
  });
  bind("#relatedTestCases", "blur", scheduleRender);
  bind("#addNominalStep", "click", addNominalStep);
  bind("#deleteNominalStep", "click", deleteNominalStep);
  bind("#moveUp", "click", () => moveNominalStep(-1));
  bind("#moveDown", "click", () => moveNominalStep(1));
  bind("#addAlternate", "click", () => addOffNominal("alternate"));
  bind("#addException", "click", () => addOffNominal("exception"));
  bind("#applyModel", "click", () => {
    saveProjectSnapshot();
    render();
  });
  bind("#documentTab", "click", () => {
    activeInspector = "document";
    render();
  });
  bind("#jsonTab", "click", () => {
    activeInspector = "json";
    render();
  });
  bind("#notationTab", "click", () => {
    activeInspector = "notation";
    render();
  });

  document.querySelectorAll("[data-palette-tool]").forEach((element) => {
    element.addEventListener("click", () => {
      setPaletteTool(element.dataset.paletteTool);
    });
  });

  document.querySelectorAll("[data-palette-relationship]").forEach((element) => {
    element.addEventListener("click", () => {
      setPaletteTool("relationship", element.dataset.paletteRelationship);
    });
  });

  document.querySelectorAll("[data-diagram-label-input]").forEach((element) => {
    element.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitDiagramLabelEdit(element.dataset.diagramLabelInput, element.value);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        editingDiagramLabelId = "";
        render();
      }
    });
    element.addEventListener("blur", () => {
      commitDiagramLabelEdit(element.dataset.diagramLabelInput, element.value);
    });
  });

  bind("#refreshJson", "click", () => {
    syncJsonDraft();
    jsonMessage = "JSON refreshed from the in-memory model.";
    render();
  });
  bind("#loadJson", "click", () => {
    try {
      projectModel = normalizeUseCaseModel(JSON.parse(document.getElementById("jsonDraft").value));
      specification = selectedUseCaseNode()?.specification ?? createBlankSpecification();
      selectedNominalStep = nominal()?.steps[0]?.number ?? 1;
      syncJsonDraft();
      jsonMessage = "Loaded JSON into the UseCaseModel.";
    } catch {
      jsonMessage = "JSON could not be parsed.";
    }
    render();
  });
  bind("#jsonDraft", "input", (event) => {
    jsonDraft = event.target.value;
  });

  document.querySelectorAll("[data-select-step]").forEach((element) => {
    element.addEventListener("click", () => {
      const step = Number(element.dataset.selectStep);
      if (step) {
        selectedNominalStep = step;
        render();
      }
    });
  });
  document.querySelectorAll("[data-step-text]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    element.addEventListener("input", (event) => {
      const [scenarioId, stepNumber] = element.dataset.stepText.split(":");
      const scenario = specification.scenarios.find((item) => item.id === scenarioId);
      const step = scenario?.steps.find((item) => item.number === Number(stepNumber));
      if (step) {
        step.text = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        const [scenarioId, stepNumber] = element.dataset.stepText.split(":");
        addStepToScenario(scenarioId, Number(stepNumber));
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-delete-step]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const [scenarioId, stepNumber] = element.dataset.deleteStep.split(":");
      updateScenario(scenarioId, (scenario) => ({
        ...scenario,
        steps: normalizeSteps(scenario.steps.filter((step) => step.number !== Number(stepNumber)))
      }));
    });
  });
  document.querySelectorAll("[data-add-step]").forEach((element) => {
    element.addEventListener("click", () => {
      const scenarioId = element.dataset.addStep;
      addStepToScenario(scenarioId);
    });
  });
  document.querySelectorAll("[data-delete-scenario]").forEach((element) => {
    element.addEventListener("click", () => deleteScenario(element.dataset.deleteScenario));
  });
  document.querySelectorAll("[data-scenario-id]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const oldId = element.dataset.scenarioId;
      const scenario = specification.scenarios.find((item) => item.id === oldId);
      if (scenario) {
        scenario.id = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-scenario-condition]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const scenario = specification.scenarios.find((item) => item.id === element.dataset.scenarioCondition);
      if (scenario) {
        scenario.condition = event.target.value;
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });
  document.querySelectorAll("[data-scenario-branch]").forEach((element) => {
    element.addEventListener("change", (event) => {
      updateScenario(element.dataset.scenarioBranch, (scenario) => ({ ...scenario, branchStep: Number(event.target.value) || undefined }));
    });
  });
  document.querySelectorAll("[data-scenario-rejoin]").forEach((element) => {
    element.addEventListener("change", (event) => {
      updateScenario(element.dataset.scenarioRejoin, (scenario) => ({ ...scenario, rejoinStep: Number(event.target.value) || undefined }));
    });
  });
  document.querySelectorAll("[data-postcondition]").forEach((element) => {
    element.addEventListener("input", (event) => {
      const scenario = specification.scenarios.find((item) => item.id === element.dataset.postcondition);
      if (scenario) {
        scenario.postcondition = parseList(event.target.value);
        updateJsonDraft();
      }
    });
    element.addEventListener("blur", scheduleRender);
  });

  if (pendingFocusStep) {
    const selector = `[data-step-text="${pendingFocusStep.scenarioId}:${pendingFocusStep.stepNumber}"]`;
    const nextInput = document.querySelector(selector);
    pendingFocusStep = null;
    if (nextInput) {
      nextInput.focus();
    }
  }

  installDiagramDragHandlers();

  if (editingDiagramLabelId) {
    const input = document.querySelector(`[data-diagram-label-input="${editingDiagramLabelId}"]`);
    if (input) {
      input.focus();
      input.select();
      return;
    }
  }

  if (pendingFocusDiagramName) {
    pendingFocusDiagramName = false;
    const input = document.getElementById("selectedDiagramName");
    if (input && !input.disabled) {
      input.focus();
      input.select();
    }
  }
}

render();
