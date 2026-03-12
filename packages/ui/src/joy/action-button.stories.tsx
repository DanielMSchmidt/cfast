import type { Meta, StoryObj } from "@storybook/react";
import type { ActionHookResult } from "@cfast/actions/client";
import { ActionButton } from "./action-button.js";

function mockAction(overrides: Partial<ActionHookResult> = {}): ActionHookResult {
  return {
    permitted: true,
    invisible: false,
    reason: null,
    submit: () => {},
    pending: false,
    data: undefined,
    error: undefined,
    ...overrides,
  };
}

const meta = {
  title: "Actions/ActionButton",
  component: ActionButton,
  args: {
    children: "Delete",
    action: mockAction(),
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    action: mockAction({ pending: true }),
  },
};

export const Disabled: Story = {
  args: {
    action: mockAction({ permitted: false, reason: "You need admin privileges" }),
    whenForbidden: "disable",
  },
};

export const Hidden: Story = {
  args: {
    action: mockAction({ permitted: false }),
    whenForbidden: "hide",
  },
};

export const DangerVariant: Story = {
  args: {
    color: "danger",
    action: mockAction(),
  },
};

export const SmallOutlined: Story = {
  args: {
    size: "sm",
    variant: "outlined",
    action: mockAction(),
  },
};
