// Extracted source module for the Structured Use Case Editor reference implementation.

export function createBlankSpecification() {
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

export function createExampleSpecification() {
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

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createUseCaseNode(id, name, x, y, specification) {
  return {
    id,
    name,
    layout: { x, y, width: 150, height: 72 },
    specification
  };
}

export function createActorNode(id, name, x, y) {
  return {
    id,
    name,
    layout: { x, y, width: 74, height: 116 }
  };
}

export function createExampleProjectModel() {
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

export function createBlankProjectModel() {
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

