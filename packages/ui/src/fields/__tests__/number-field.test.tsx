import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { NumberField } from "../number-field.js";

afterEach(cleanup);

describe("NumberField", () => {
  it("renders em-dash for null value", () => {
    render(createElement(NumberField, { value: null }));
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("formats number with default locale", () => {
    render(createElement(NumberField, { value: 1234.5, locale: "en-US" }));
    expect(screen.getByText("1,234.5")).toBeTruthy();
  });

  it("formats currency", () => {
    render(createElement(NumberField, { value: 42.99, currency: "USD", locale: "en-US" }));
    expect(screen.getByText("$42.99")).toBeTruthy();
  });

  it("formats with fixed decimals", () => {
    render(createElement(NumberField, { value: 3, decimals: 2, locale: "en-US" }));
    expect(screen.getByText("3.00")).toBeTruthy();
  });
});
