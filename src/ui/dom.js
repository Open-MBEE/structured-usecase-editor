// Extracted source module for the Structured Use Case Editor reference implementation.

export function icon(name) {
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
    copy: "M8 8h11v11H8zM5 16H4V4h12v1",
    download: "M12 3v12M7 10l5 5 5-5M5 21h14",
    folder: "M3 6h7l2 2h9v11H3z",
    help: "M9.1 9a3 3 0 1 1 5.8 1c-.7 1.1-1.9 1.5-2.4 2.5M12 17h.01",
    save: "M5 3h12l2 2v16H5zM8 3v6h8M8 21v-7h8v7",
    reset: "M3 12a9 9 0 1 0 3-6.7M3 3v6h6"
  };
  return `<svg class="miniIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"></path></svg>`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
