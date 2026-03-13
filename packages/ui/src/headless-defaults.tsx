import type { UIPluginComponents } from "./types.js";

/**
 * Minimal unstyled HTML implementations for every plugin slot.
 * These are used when no plugin provides a component for a given slot.
 */
export const headlessDefaults: UIPluginComponents = {
  // Actions
  button: ({ children, onClick, disabled, loading, type }) => (
    <button onClick={onClick} disabled={disabled || loading} type={type ?? "button"}>
      {loading ? "Loading..." : children}
    </button>
  ),

  tooltip: ({ children, title }) => (
    <span title={title}>{children}</span>
  ),

  confirmDialog: ({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel }) =>
    open
      ? (
          <dialog open>
            <p><strong>{title}</strong></p>
            {description ? <p>{description}</p> : null}
            <div>
              <button onClick={onClose}>{cancelLabel ?? "Cancel"}</button>
              <button onClick={onConfirm}>{confirmLabel ?? "Confirm"}</button>
            </div>
          </dialog>
        )
      : null,

  // Data display
  table: ({ children }) => <table>{children}</table>,

  tableHead: ({ children }) => <thead>{children}</thead>,

  tableBody: ({ children }) => <tbody>{children}</tbody>,

  tableRow: ({ children, onClick }) => (
    <tr onClick={onClick}>{children}</tr>
  ),

  tableCell: ({ children, header, sortable, sortDirection, onSort }) => {
    const Tag = header ? "th" : "td";
    return (
      <Tag
        onClick={sortable ? onSort : undefined}
        style={sortable ? { cursor: "pointer" } : undefined}
      >
        {children}
        {sortable && sortDirection ? (sortDirection === "asc" ? " \u2191" : " \u2193") : null}
      </Tag>
    );
  },

  chip: ({ children, size }) => (
    <span
      style={{
        display: "inline-block",
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        borderRadius: "12px",
        fontSize: size === "sm" ? "12px" : "14px",
        backgroundColor: "#eee",
      }}
    >
      {children}
    </span>
  ),

  // Layout
  appShell: ({ children, sidebar, header }) => (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {sidebar ? <nav>{sidebar}</nav> : null}
      <div style={{ flex: 1 }}>
        {header ?? null}
        <main>{children}</main>
      </div>
    </div>
  ),

  sidebar: ({ children }) => (
    <aside style={{ width: "240px", borderRight: "1px solid #ddd" }}>
      {children}
    </aside>
  ),

  pageContainer: ({ children, title, actions }) => (
    <div>
      {title || actions
        ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {title ? <h1>{title}</h1> : null}
              {actions ?? null}
            </div>
          )
        : null}
      {children}
    </div>
  ),

  breadcrumb: ({ items }) => (
    <nav aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 ? " / " : null}
          {item.to
            ? <a href={item.to}>{item.label}</a>
            : item.label}
        </span>
      ))}
    </nav>
  ),

  // Feedback
  toast: ({ children }) => <div>{children}</div>,

  alert: ({ children, color }) => (
    <div
      role="alert"
      style={{
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
      }}
    >
      {children}
    </div>
  ),

  // File
  dropZone: ({ children, isDragOver, onClick, onDrop, onDragOver, onDragLeave }) => (
    <div
      onClick={onClick}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault();
        onDrop(e.dataTransfer.files);
      }}
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragLeave={onDragLeave}
      style={{
        border: `2px dashed ${isDragOver ? "#4caf50" : "#ccc"}`,
        borderRadius: "8px",
        padding: "32px",
        textAlign: "center" as const,
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  ),
};
