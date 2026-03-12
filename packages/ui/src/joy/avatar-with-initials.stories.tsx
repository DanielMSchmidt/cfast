import type { Meta, StoryObj } from "@storybook/react";
import { AvatarWithInitials } from "./avatar-with-initials.js";

const meta = {
  title: "Utilities/AvatarWithInitials",
  component: AvatarWithInitials,
} satisfies Meta<typeof AvatarWithInitials>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitials: Story = {
  args: {
    name: "Jane Doe",
  },
};

export const WithImage: Story = {
  args: {
    name: "Jane Doe",
    src: "https://i.pravatar.cc/150?u=jane",
  },
};

export const SingleName: Story = {
  args: {
    name: "Admin",
  },
};

export const Small: Story = {
  args: {
    name: "Jane Doe",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    name: "Jane Doe",
    size: "lg",
  },
};
