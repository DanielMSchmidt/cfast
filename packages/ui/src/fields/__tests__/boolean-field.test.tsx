import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BooleanField } from "../boolean-field.js";

afterEach(cleanup);

describe("BooleanField", () => {
  it("renders em-dash for null value", () => {
    render(<BooleanField value={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders true label when value is true", () => {
    render(<BooleanField value={true} />);
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("renders false label when value is false", () => {
    render(<BooleanField value={false} />);
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("renders custom labels", () => {
    render(
      <BooleanField value={true} trueLabel="Published" falseLabel="Draft" />,
    );
    expect(screen.getByText("Published")).toBeTruthy();
  });
});
