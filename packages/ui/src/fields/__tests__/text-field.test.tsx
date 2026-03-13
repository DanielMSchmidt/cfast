import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TextField } from "../text-field.js";

afterEach(cleanup);

describe("TextField", () => {
  it("renders em-dash for null value", () => {
    render(<TextField value={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders text as-is", () => {
    render(<TextField value="Hello World" />);
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("truncates with ellipsis when maxLength exceeded", () => {
    render(<TextField value="A long text" maxLength={6} />);
    expect(screen.getByText("A long…")).toBeTruthy();
  });

  it("shows full text in title when truncated", () => {
    render(<TextField value="A long text value" maxLength={6} />);
    expect(screen.getByText("A long…").getAttribute("title")).toBe("A long text value");
  });
});
