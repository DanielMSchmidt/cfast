import type { Meta, StoryObj } from "@storybook/react";
import { RoleBadge } from "./role-badge.js";

const meta = {
  title: "Utilities/RoleBadge",
  component: RoleBadge,
} satisfies Meta<typeof RoleBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Admin: Story = {
  args: { role: "admin" },
};

export const Editor: Story = {
  args: { role: "editor" },
};

export const Author: Story = {
  args: { role: "author" },
};

export const Reader: Story = {
  args: { role: "reader" },
};

export const UnknownRole: Story = {
  args: { role: "moderator" },
};

export const CustomColors: Story = {
  args: {
    role: "superadmin",
    colors: { superadmin: "warning" },
  },
};
