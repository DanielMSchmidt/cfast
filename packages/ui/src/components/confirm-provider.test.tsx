import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { ConfirmProvider } from "./confirm-provider.js";
import { useConfirm } from "../hooks/use-confirm.js";

afterEach(cleanup);

function TestConsumer() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>("pending");

  return (
    <div>
      <button
        data-testid="trigger"
        onClick={async () => {
          const confirmed = await confirm({
            title: "Delete item?",
            description: "This cannot be undone.",
            confirmLabel: "Yes, delete",
            cancelLabel: "No",
            variant: "danger",
          });
          setResult(confirmed ? "confirmed" : "cancelled");
        }}
      >
        Open dialog
      </button>
      <span data-testid="result">{result}</span>
    </div>
  );
}

describe("ConfirmProvider", () => {
  it("provides useConfirm context and renders dialog on trigger", async () => {
    render(
      <ConfirmProvider>
        <TestConsumer />
      </ConfirmProvider>,
    );

    expect(screen.getByTestId("result").textContent).toBe("pending");

    // Open dialog
    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    // Dialog should appear (headless default uses <dialog>)
    expect(screen.getByText("Delete item?")).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
  });

  it("resolves true when confirmed", async () => {
    render(
      <ConfirmProvider>
        <TestConsumer />
      </ConfirmProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Yes, delete"));
    });

    expect(screen.getByTestId("result").textContent).toBe("confirmed");
  });

  it("resolves false when cancelled", async () => {
    render(
      <ConfirmProvider>
        <TestConsumer />
      </ConfirmProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("No"));
    });

    expect(screen.getByTestId("result").textContent).toBe("cancelled");
  });
});
