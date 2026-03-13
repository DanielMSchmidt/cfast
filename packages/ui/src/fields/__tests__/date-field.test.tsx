import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DateField } from "../date-field.js";

afterEach(cleanup);

describe("DateField", () => {
  it("renders em-dash for null value", () => {
    render(<DateField value={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("formats date in short format by default", () => {
    render(<DateField value={new Date("2026-03-11T00:00:00Z")} locale="en-US" />);
    const time = document.querySelector("time");
    expect(time).toBeTruthy();
    expect(time?.textContent).toMatch(/Mar/);
  });

  it("formats date in long format", () => {
    render(<DateField value="2026-03-11" format="long" locale="en-US" />);
    expect(screen.getByText(/March/)).toBeTruthy();
  });

  it("handles invalid date", () => {
    render(<DateField value="not-a-date" />);
    expect(screen.getByText("Invalid date")).toBeTruthy();
  });

  it("formats relative dates", () => {
    const now = new Date();
    render(<DateField value={now} format="relative" />);
    // "now" or "0 seconds ago" or similar
    const time = document.querySelector("time");
    expect(time).toBeTruthy();
  });
});
