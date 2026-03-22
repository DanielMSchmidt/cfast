import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { joyLoginComponents } from "./login-components.js";

const { Layout, EmailInput, MagicLinkButton, PasskeyButton, SuccessMessage, ErrorMessage } =
  joyLoginComponents;

// Wrapper component for Storybook since we demo individual slots
function LoginDemo({
  showSuccess,
  showError,
  errorText,
}: {
  showSuccess?: boolean;
  showError?: boolean;
  errorText?: string;
}) {
  const [email, setEmail] = useState("");

  if (showSuccess) {
    return (
      <Layout>
        <SuccessMessage email="user@example.com" />
      </Layout>
    );
  }

  return (
    <Layout>
      {showError && <ErrorMessage error={errorText ?? "Something went wrong"} />}
      <EmailInput value={email} onChange={setEmail} />
      <div style={{ marginTop: 16 }}>
        <MagicLinkButton onClick={() => {}} loading={false} />
      </div>
      <div style={{ marginTop: 16 }}>
        <PasskeyButton onClick={() => {}} loading={false} />
      </div>
    </Layout>
  );
}

const meta: Meta<typeof LoginDemo> = {
  title: "Joy/LoginComponents",
  component: LoginDemo,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    showError: true,
    errorText: "Invalid email address",
  },
};

export const Success: Story = {
  args: {
    showSuccess: true,
  },
};
