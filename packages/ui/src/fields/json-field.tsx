import { createElement, useState } from "react";
import type { JsonFieldProps } from "../types.js";

export function JsonField({
  value,
  collapsed = false,
}: JsonFieldProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  if (value == null) {
    return createElement("span", null, "—");
  }

  const formatted = JSON.stringify(value, null, 2);

  if (isCollapsed) {
    const preview = JSON.stringify(value);
    const short = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
    return createElement(
      "span",
      null,
      createElement("code", null, short),
      " ",
      createElement("button", {
        onClick: () => setIsCollapsed(false),
        style: { border: "none", background: "none", cursor: "pointer", color: "#666", fontSize: "12px" },
      }, "expand"),
    );
  }

  return createElement(
    "pre",
    {
      style: {
        margin: 0,
        fontSize: "13px",
        backgroundColor: "#f5f5f5",
        padding: "8px",
        borderRadius: "4px",
        overflow: "auto",
      },
    },
    createElement("code", null, formatted),
  );
}
