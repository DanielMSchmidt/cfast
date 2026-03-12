import { createElement } from "react";
import type { UIPluginComponents } from "./types.js";

/**
 * Minimal unstyled HTML implementations for every plugin slot.
 * These are used when no plugin provides a component for a given slot.
 */
export const headlessDefaults: UIPluginComponents = {
  // Actions
  button: ({ children, onClick, disabled, loading, type }) =>
    createElement(
      "button",
      { onClick, disabled: disabled || loading, type: type ?? "button" },
      loading ? "Loading..." : children,
    ),

  tooltip: ({ children, title }) =>
    createElement("span", { title }, children),

  confirmDialog: ({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel }) =>
    open
      ? createElement(
          "dialog",
          { open: true },
          createElement("p", null, createElement("strong", null, title)),
          description ? createElement("p", null, description) : null,
          createElement(
            "div",
            null,
            createElement("button", { onClick: onClose }, cancelLabel ?? "Cancel"),
            createElement("button", { onClick: onConfirm }, confirmLabel ?? "Confirm"),
          ),
        )
      : null,

  // Data display
  table: ({ children }) => createElement("table", null, children),

  tableHead: ({ children }) => createElement("thead", null, children),

  tableBody: ({ children }) => createElement("tbody", null, children),

  tableRow: ({ children, onClick }) =>
    createElement("tr", { onClick }, children),

  tableCell: ({ children, header, sortable, sortDirection, onSort }) =>
    createElement(
      header ? "th" : "td",
      {
        onClick: sortable ? onSort : undefined,
        style: sortable ? { cursor: "pointer" } : undefined,
      },
      children,
      sortable && sortDirection ? (sortDirection === "asc" ? " ↑" : " ↓") : null,
    ),

  chip: ({ children, size }) =>
    createElement(
      "span",
      {
        style: {
          display: "inline-block",
          padding: size === "sm" ? "1px 6px" : "2px 8px",
          borderRadius: "12px",
          fontSize: size === "sm" ? "12px" : "14px",
          backgroundColor: "#eee",
        },
      },
      children,
    ),

  // Layout
  appShell: ({ children, sidebar, header }) =>
    createElement(
      "div",
      { style: { display: "flex", minHeight: "100vh" } },
      sidebar ? createElement("nav", null, sidebar) : null,
      createElement(
        "div",
        { style: { flex: 1 } },
        header ?? null,
        createElement("main", null, children),
      ),
    ),

  sidebar: ({ children }) =>
    createElement(
      "aside",
      { style: { width: "240px", borderRight: "1px solid #ddd" } },
      children,
    ),

  pageContainer: ({ children, title, actions }) =>
    createElement(
      "div",
      null,
      title || actions
        ? createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            title ? createElement("h1", null, title) : null,
            actions ?? null,
          )
        : null,
      children,
    ),

  breadcrumb: ({ items }) =>
    createElement(
      "nav",
      { "aria-label": "breadcrumb" },
      items.map((item, i) =>
        createElement(
          "span",
          { key: i },
          i > 0 ? " / " : null,
          item.to
            ? createElement("a", { href: item.to }, item.label)
            : item.label,
        ),
      ),
    ),

  // Feedback
  toast: ({ children }) => createElement("div", null, children),

  alert: ({ children, color }) =>
    createElement(
      "div",
      {
        role: "alert",
        style: {
          padding: "8px 12px",
          borderRadius: "4px",
          backgroundColor:
            color === "danger"
              ? "#fee"
              : color === "success"
                ? "#efe"
                : color === "warning"
                  ? "#ffe"
                  : "#f5f5f5",
        },
      },
      children,
    ),

  // File
  dropZone: ({ children, isDragOver, onClick, onDrop, onDragOver, onDragLeave }) =>
    createElement(
      "div",
      {
        onClick,
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          onDrop(e.dataTransfer.files);
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          onDragOver(e);
        },
        onDragLeave,
        style: {
          border: `2px dashed ${isDragOver ? "#4caf50" : "#ccc"}`,
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center" as const,
          cursor: "pointer",
        },
      },
      children,
    ),
};
