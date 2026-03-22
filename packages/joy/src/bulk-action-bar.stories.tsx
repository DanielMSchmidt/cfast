import type { Meta, StoryObj } from "@storybook/react";
import { BulkActionBar } from "./bulk-action-bar.js";
import type { BulkAction } from "@cfast/ui";

const ACTIONS: BulkAction[] = [
  { label: "Publish" },
  { label: "Archive" },
  { label: "Delete" },
];

const meta = {
  title: "Joy/BulkActionBar",
  component: BulkActionBar,
  parameters: { layout: "padded" },
  args: {
    onAction: () => {},
    onClearSelection: () => {},
  },
} satisfies Meta<typeof BulkActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneSelected: Story = {
  args: {
    selectedCount: 1,
    actions: ACTIONS,
  },
};

export const ManySelected: Story = {
  args: {
    selectedCount: 12,
    actions: ACTIONS,
  },
};

export const SingleAction: Story = {
  args: {
    selectedCount: 3,
    actions: [{ label: "Delete" }],
  },
};

export const Hidden: Story = {
  args: {
    selectedCount: 0,
    actions: ACTIONS,
  },
  parameters: {
    docs: {
      description: {
        story: "When selectedCount is 0 the bar renders nothing.",
      },
    },
  },
};
