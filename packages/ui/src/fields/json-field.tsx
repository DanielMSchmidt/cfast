import { useState } from "react";
import type { JsonFieldProps } from "../types.js";

/**
 * Read-only display component that renders a JSON value as formatted code.
 *
 * When `collapsed` is true, shows a single-line preview (truncated at 60 chars)
 * with an "expand" button. When expanded, displays the full pretty-printed JSON
 * in a `<pre>` block. Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link JsonFieldProps}.
 * @returns A `<pre>` with formatted JSON, a collapsed preview, or a
 *   placeholder `<span>` for null values.
 *
 * @example
 * ```tsx
 * <JsonField value={{ tags: ["react", "typescript"] }} collapsed />
 * // -> '{"tags":["react","typescript"]}' with expand button
 * ```
 */
export function JsonField({
  value,
  collapsed = false,
}: JsonFieldProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  if (value == null) {
    return <span>—</span>;
  }

  const formatted = JSON.stringify(value, null, 2);

  if (isCollapsed) {
    const preview = JSON.stringify(value);
    const short = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
    return (
      <span>
        <code>{short}</code>
        {" "}
        <button
          onClick={() => setIsCollapsed(false)}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#666", fontSize: "12px" }}
        >
          expand
        </button>
      </span>
    );
  }

  return (
    <pre
      style={{
        margin: 0,
        fontSize: "13px",
        backgroundColor: "#f5f5f5",
        padding: "8px",
        borderRadius: "4px",
        overflow: "auto",
      }}
    >
      <code>{formatted}</code>
    </pre>
  );
}
