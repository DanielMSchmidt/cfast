// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "../client/login-page";

function createMockAuthClient() {
  return {
    signIn: {
      magicLink: vi.fn().mockResolvedValue({}),
      passkey: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("LoginPage", () => {
  let mockAuthClient: ReturnType<typeof createMockAuthClient>;

  beforeEach(() => {
    mockAuthClient = createMockAuthClient();
  });

  it("renders email input and both sign-in buttons", () => {
    render(<LoginPage authClient={mockAuthClient} />);

    expect(screen.getByPlaceholderText("you@example.com")).toBeDefined();
    expect(screen.getByText(/magic link/i)).toBeDefined();
    expect(screen.getByText(/passkey/i)).toBeDefined();
  });

  it("renders default title", () => {
    render(<LoginPage authClient={mockAuthClient} />);
    expect(screen.getByText("Sign In")).toBeDefined();
  });

  it("renders custom title and subtitle", () => {
    render(
      <LoginPage
        authClient={mockAuthClient}
        title="Welcome"
        subtitle="Please sign in"
      />,
    );

    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Please sign in")).toBeDefined();
  });

  it("calls authClient.signIn.magicLink on form submit", async () => {
    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(mockAuthClient.signIn.magicLink).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });

  it("shows success message after magic link sent", async () => {
    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeDefined();
    });
  });

  it("shows error when magic link fails", async () => {
    mockAuthClient.signIn.magicLink.mockResolvedValue({
      error: { message: "Invalid email" },
    });

    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeDefined();
    });
  });

  it("calls authClient.signIn.passkey on passkey button click", async () => {
    render(<LoginPage authClient={mockAuthClient} />);

    fireEvent.click(screen.getByText(/passkey/i));

    await waitFor(() => {
      expect(mockAuthClient.signIn.passkey).toHaveBeenCalled();
    });
  });

  it("shows error when passkey fails", async () => {
    mockAuthClient.signIn.passkey.mockResolvedValue({
      error: { message: "Passkey not available" },
    });

    render(<LoginPage authClient={mockAuthClient} />);

    fireEvent.click(screen.getByText(/passkey/i));

    await waitFor(() => {
      expect(screen.getByText("Passkey not available")).toBeDefined();
    });
  });

  it("uses custom Layout component when provided", () => {
    render(
      <LoginPage
        authClient={mockAuthClient}
        components={{
          Layout: ({ children }) => (
            <div data-testid="custom-layout">{children}</div>
          ),
        }}
      />,
    );

    expect(screen.getByTestId("custom-layout")).toBeDefined();
  });

  it("uses custom ErrorMessage component when provided", async () => {
    mockAuthClient.signIn.magicLink.mockResolvedValue({
      error: { message: "Boom" },
    });

    render(
      <LoginPage
        authClient={mockAuthClient}
        components={{
          ErrorMessage: ({ error }) => (
            <div data-testid="custom-error">Custom: {error}</div>
          ),
        }}
      />,
    );

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByTestId("custom-error")).toBeDefined();
      expect(screen.getByText("Custom: Boom")).toBeDefined();
    });
  });

  it("uses custom SuccessMessage component when provided", async () => {
    render(
      <LoginPage
        authClient={mockAuthClient}
        components={{
          SuccessMessage: ({ email }) => (
            <div data-testid="custom-success">Sent to {email}</div>
          ),
        }}
      />,
    );

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByTestId("custom-success")).toBeDefined();
      expect(screen.getByText("Sent to test@example.com")).toBeDefined();
    });
  });

  it("calls onSuccess after successful magic link", async () => {
    const onSuccess = vi.fn();

    render(
      <LoginPage authClient={mockAuthClient} onSuccess={onSuccess} />,
    );

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
