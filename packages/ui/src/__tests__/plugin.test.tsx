import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "../plugin.js";
import type { ButtonSlotProps } from "../types.js";

afterEach(cleanup);

function TestButton(props: ButtonSlotProps) {
  return createElement("button", { "data-testid": "custom-button" }, props.children);
}

function UsePluginConsumer() {
  const plugin = useUIPlugin();
  return createElement("div", { "data-testid": "plugin-value" }, plugin ? "has-plugin" : "no-plugin");
}

function UseComponentConsumer() {
  const Button = useComponent("button");
  return createElement(Button, { children: "Click me" });
}

describe("createUIPlugin", () => {
  it("creates a plugin with provided components", () => {
    const plugin = createUIPlugin({
      components: { button: TestButton },
    });
    expect(plugin.components.button).toBe(TestButton);
  });

  it("creates a plugin with empty components", () => {
    const plugin = createUIPlugin({ components: {} });
    expect(plugin.components).toEqual({});
  });
});

describe("UIPluginProvider", () => {
  it("provides plugin to children", () => {
    const plugin = createUIPlugin({ components: {} });
    render(
      createElement(UIPluginProvider, {
        plugin,
        children: createElement(UsePluginConsumer),
      }),
    );
    expect(screen.getByTestId("plugin-value").textContent).toBe("has-plugin");
  });
});

describe("useUIPlugin", () => {
  it("returns null when no provider is present", () => {
    render(createElement(UsePluginConsumer));
    expect(screen.getByTestId("plugin-value").textContent).toBe("no-plugin");
  });
});

describe("useComponent", () => {
  it("returns headless default when no plugin provides the slot", () => {
    render(createElement(UseComponentConsumer));
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe("Click me");
  });

  it("returns plugin component when provided", () => {
    const plugin = createUIPlugin({ components: { button: TestButton } });
    render(
      createElement(UIPluginProvider, {
        plugin,
        children: createElement(UseComponentConsumer),
      }),
    );
    expect(screen.getByTestId("custom-button")).toBeTruthy();
    expect(screen.getByTestId("custom-button").textContent).toBe("Click me");
  });

  it("falls back to headless default for unprovided slots", () => {
    const plugin = createUIPlugin({ components: { button: TestButton } });

    function TooltipConsumer() {
      const Tooltip = useComponent("tooltip");
      return createElement(Tooltip, { title: "test", children: "hover me" });
    }

    render(
      createElement(UIPluginProvider, {
        plugin,
        children: createElement(TooltipConsumer),
      }),
    );
    expect(screen.getByText("hover me").getAttribute("title")).toBe("test");
  });
});
