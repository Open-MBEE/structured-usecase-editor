// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { labels } from "../model/constants.js";
import { nominal } from "../model/selectors.js";
import { escapeHtml, icon } from "../ui/dom.js";

export function scenarioHeading(scenario) {
  if (scenario.type === "nominal") {
    return labels.nominal;
  }
  return `${labels[scenario.type]} ${scenario.id}${scenario.condition ? `: ${scenario.condition}` : ""}`;
}

export function formatStepNumber(scenario, step) {
  return scenario.type === "nominal" ? String(step.number) : `${scenario.id}.${step.number}`;
}

export function renderScenario(scenario) {
  const isNominal = scenario.type === "nominal";
  const accent = scenario.type === "alternate" ? "alternate" : scenario.type === "exception" ? "exception" : "nominal";
  const nominalSteps = nominal()?.steps ?? [];
  const rows = scenario.steps
    .map(
      (step) => `
        <tr class="${state.selectedNominalStep === step.number && isNominal ? "selectedRow" : ""}" data-select-step="${isNominal ? step.number : ""}">
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

export function renderDocument() {
  const base = nominal();
  const offNominal = state.specification.scenarios.filter((scenario) => scenario.type !== "nominal");
  const hasPreconditions = state.specification.preconditions.some((item) => item.trim());
  const hasRequirements = state.specification.requirements.some((item) => item.trim());
  return `
    <div class="documentPreview">
      <h2>Use Case: ${escapeHtml(state.specification.name || "Untitled")}</h2>
      <dl>
        <dt>Actor</dt><dd>Modeler</dd>
        ${hasPreconditions ? `<dt>Preconditions</dt><dd>${escapeHtml(state.specification.preconditions.join("; "))}</dd>` : ""}
        ${hasRequirements ? `<dt>Requirements</dt><dd>${escapeHtml(state.specification.requirements.join(", "))}</dd>` : ""}
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
