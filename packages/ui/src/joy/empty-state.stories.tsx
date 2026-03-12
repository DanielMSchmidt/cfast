import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { EmptyState } from "./empty-state.js";

const meta: Meta<typeof EmptyState> = {
  title: "Joy/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: "No items found",
  },
};

export const WithDescription: Story = {
  args: {
    title: "No posts yet",
    description: "Get started by creating your first post.",
  },
};

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export const WithIcon: Story = {
  args: {
    title: "No documents",
    description: "Upload a document to get started.",
    icon: FolderIcon,
  },
};
