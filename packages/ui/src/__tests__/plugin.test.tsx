import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createUIPlugin, UIPluginProvider, useUIPlugin, useComponent } from "../plugin.js";
import type { ButtonSlotProps } from "../types.js";

afterEach(cleanup);

function TestButton(props: ButtonSlotProps) {
  return <button data-testid="custom-button">{props.children}</button>;
}

function UsePluginConsumer() {
  const plugin = useUIPlugin();
  return <div data-testid="plugin-value">{plugin ? "has-plugin" : "no-plugin"}</div>;
}

function UseComponentConsumer() {
  const Button = useComponent("button");
  return <Button>Click me</Button>;
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
      <UIPluginProvider plugin={plugin}>
        <UsePluginConsumer />
      </UIPluginProvider>,
    );
    expect(screen.getByTestId("plugin-value").textContent).toBe("has-plugin");
  });
});

describe("useUIPlugin", () => {
  it("returns null when no provider is present", () => {
    render(<UsePluginConsumer />);
    expect(screen.getByTestId("plugin-value").textContent).toBe("no-plugin");
  });
});

describe("useComponent", () => {
  it("returns headless default when no plugin provides the slot", () => {
    render(<UseComponentConsumer />);
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe("Click me");
  });

  it("returns plugin component when provided", () => {
    const plugin = createUIPlugin({ components: { button: TestButton } });
    render(
      <UIPluginProvider plugin={plugin}>
        <UseComponentConsumer />
      </UIPluginProvider>,
    );
    expect(screen.getByTestId("custom-button")).toBeTruthy();
    expect(screen.getByTestId("custom-button").textContent).toBe("Click me");
  });

  it("falls back to headless default for unprovided slots", () => {
    const plugin = createUIPlugin({ components: { button: TestButton } });

    function TooltipConsumer() {
      const Tooltip = useComponent("tooltip");
      return <Tooltip title="test">hover me</Tooltip>;
    }

    render(
      <UIPluginProvider plugin={plugin}>
        <TooltipConsumer />
      </UIPluginProvider>,
    );
    expect(screen.getByText("hover me").getAttribute("title")).toBe("test");
  });
});
