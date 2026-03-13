import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FormStatus } from "./form-status.js";

afterEach(cleanup);

describe("FormStatus", () => {
  it("renders nothing when data is null", () => {
    const { container } = render(
      <FormStatus data={null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders success alert", () => {
    render(
      <FormStatus data={{ success: "Saved successfully" }} />,
    );
    expect(screen.getByText("Saved successfully")).toBeTruthy();
  });

  it("renders error alert", () => {
    render(
      <FormStatus data={{ error: "Something went wrong" }} />,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("renders field errors as a list", () => {
    render(
      <FormStatus
        data={{
          fieldErrors: {
            title: ["Required"],
            email: ["Invalid format", "Already taken"],
          },
        }}
      />,
    );
    expect(screen.getByText("title: Required")).toBeTruthy();
    expect(screen.getByText("email: Invalid format")).toBeTruthy();
    expect(screen.getByText("email: Already taken")).toBeTruthy();
  });

  it("renders both success and error when both present", () => {
    render(
      <FormStatus data={{ success: "Saved", error: "But with warnings" }} />,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("But with warnings")).toBeTruthy();
  });
});
