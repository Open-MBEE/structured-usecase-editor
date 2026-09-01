# Source Architecture

This directory contains the active ES module source for the Structured Use Case Editor.

`standalone.html` loads `src/main.js`, which starts the editor through `src/app/appController.js`.

`src/app/appController.js` is the coordinator for startup state, persistence loading, and the initial render. The implementation responsibilities are split across the module areas below. The previous one-file implementation is preserved in `legacy/standalone-app.js` as a behavior reference for one release.

## Module Areas

- `model/` - model factories, normalization, selectors, and scenario operations
- `diagram/` - diagram geometry, rendering, and interactions
- `specification/` - specification editor rendering
- `serializers/` - document, JSON, and SysML v2 serialization/rendering
- `storage/` - localStorage persistence
- `textual/` - textual view rendering
- `ui/` - DOM helpers, app rendering, and event binding
