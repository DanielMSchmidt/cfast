import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmDialog } from "./confirm-dialog.js";

const meta = {
  title: "Feedback/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: true,
    onClose: () => {},
    onConfirm: () => {},
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Delete this post?",
    description: "This action cannot be undone.",
  },
};

export const Danger: Story = {
  args: {
    title: "Delete account?",
    description: "All your data will be permanently removed.",
    variant: "danger",
    confirmLabel: "Delete",
  },
};

export const CustomLabels: Story = {
  args: {
    title: "Discard unsaved changes?",
    confirmLabel: "Discard",
    cancelLabel: "Keep editing",
  },
};

export const NoDescription: Story = {
  args: {
    title: "Are you sure?",
  },
};
