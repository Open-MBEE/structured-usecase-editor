// Extracted source module for the Structured Use Case Editor reference implementation.

export const relationshipKinds = {
  association: { label: "Association", lineLabel: "", dashed: false, arrow: true },
  include: { label: "Includes", lineLabel: "«include»", dashed: true, arrow: true },
  extend: { label: "Extends", lineLabel: "«extend»", dashed: true, arrow: true },
  invoke: { label: "Invokes", lineLabel: "«invoke»", dashed: false, arrow: true },
  precedes: { label: "Precedes", lineLabel: "«precede»", dashed: false, arrow: true }
};

export const legacyRelationshipType = {
  Association: "association",
  Includes: "include",
  Extends: "extend",
  Invokes: "invoke",
  Precedes: "precedes"
};

export const DIAGRAM_WIDTH = 1200;

export const DIAGRAM_HEIGHT = 760;

export const DIAGRAM_MARGIN = 10;

export const labels = {
  nominal: "Basic (Nominal) Scenario",
  alternate: "Alternate Scenario",
  exception: "Exception Scenario"
};

