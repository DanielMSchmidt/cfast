// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "../client/login-page";

function createMockAuthClient(opts?: { withPasskeySignUp?: boolean }) {
  return {
    signIn: {
      magicLink: vi.fn().mockResolvedValue({}),
      passkey: vi.fn().mockResolvedValue({}),
    },
    signUp: opts?.withPasskeySignUp
      ? { email: vi.fn().mockResolvedValue({}) }
      : undefined,
    passkey: opts?.withPasskeySignUp
      ? { addPasskey: vi.fn().mockResolvedValue({}) }
      : undefined,
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

  describe("Passkey sign-up", () => {
    it("shows sign-up button when both signUp.email and passkey.addPasskey are present", () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      render(<LoginPage authClient={client} />);

      expect(screen.getByText(/sign up with passkey/i)).toBeDefined();
    });

    it("hides sign-up button when signUp.email is missing", () => {
      const client = createMockAuthClient();
      render(<LoginPage authClient={client} />);

      expect(screen.queryByText(/sign up with passkey/i)).toBeNull();
    });

    it("hides sign-up button when passkey.addPasskey is missing", () => {
      const client = {
        signIn: {
          magicLink: vi.fn().mockResolvedValue({}),
          passkey: vi.fn().mockResolvedValue({}),
        },
        signUp: { email: vi.fn().mockResolvedValue({}) },
      };
      render(<LoginPage authClient={client} />);

      expect(screen.queryByText(/sign up with passkey/i)).toBeNull();
    });

    it("shows validation error when clicking sign-up without email", async () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      render(<LoginPage authClient={client} />);

      fireEvent.click(screen.getByText(/sign up with passkey/i));

      await waitFor(() => {
        expect(
          screen.getByText("Please enter your email address."),
        ).toBeDefined();
      });
    });

    it("calls signUp.email then addPasskey on successful sign-up", async () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      const onSuccess = vi.fn();
      render(<LoginPage authClient={client} onSuccess={onSuccess} />);

      const input = screen.getByPlaceholderText("you@example.com");
      fireEvent.change(input, { target: { value: "new@example.com" } });
      fireEvent.click(screen.getByText(/sign up with passkey/i));

      await waitFor(() => {
        expect(client.signUp!.email).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "new@example.com",
            name: "",
          }),
        );
      });

      await waitFor(() => {
        expect(client.passkey!.addPasskey).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("shows error and skips addPasskey when signUp.email fails", async () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      client.signUp!.email.mockResolvedValue({
        error: { message: "User already exists" },
      });

      render(<LoginPage authClient={client} />);

      const input = screen.getByPlaceholderText("you@example.com");
      fireEvent.change(input, {
        target: { value: "existing@example.com" },
      });
      fireEvent.click(screen.getByText(/sign up with passkey/i));

      await waitFor(() => {
        expect(screen.getByText("User already exists")).toBeDefined();
      });

      expect(client.passkey!.addPasskey).not.toHaveBeenCalled();
    });

    it("shows error when addPasskey fails after successful sign-up", async () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      client.passkey!.addPasskey.mockResolvedValue({
        error: { message: "Passkey registration failed" },
      });

      render(<LoginPage authClient={client} />);

      const input = screen.getByPlaceholderText("you@example.com");
      fireEvent.change(input, { target: { value: "new@example.com" } });
      fireEvent.click(screen.getByText(/sign up with passkey/i));

      await waitFor(() => {
        expect(
          screen.getByText("Passkey registration failed"),
        ).toBeDefined();
      });
    });

    it("uses custom PasskeySignUpButton when provided", () => {
      const client = createMockAuthClient({ withPasskeySignUp: true });
      render(
        <LoginPage
          authClient={client}
          components={{
            PasskeySignUpButton: ({ onClick, loading }) => (
              <button
                data-testid="custom-signup"
                onClick={onClick}
                disabled={loading}
              >
                Custom Sign Up
              </button>
            ),
          }}
        />,
      );

      expect(screen.getByTestId("custom-signup")).toBeDefined();
    });
  });
});
