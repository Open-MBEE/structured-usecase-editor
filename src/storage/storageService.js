// Extracted source module for the Structured Use Case Editor reference implementation.

import { state } from "../app/state.js";
import { normalizeUseCaseModel } from "../model/normalize.js";

export const storageKey = "structuredUseCaseProjectModel";

export function saveProjectSnapshot() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state.projectModel));
  } catch {
    // Local file storage can be unavailable in some browser settings.
  }
}

export function loadProjectSnapshot() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? normalizeUseCaseModel(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}
