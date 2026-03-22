import type { Meta, StoryObj } from "@storybook/react";
import { FormStatus } from "./form-status.js";

const meta = {
  title: "Feedback/FormStatus",
  component: FormStatus,
} satisfies Meta<typeof FormStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    data: { success: "Post published successfully." },
  },
};

export const Error: Story = {
  args: {
    data: { error: "Something went wrong. Please try again." },
  },
};

export const FieldErrors: Story = {
  args: {
    data: {
      fieldErrors: {
        title: ["Title is required", "Title must be at least 3 characters"],
        email: ["Invalid email address"],
      },
    },
  },
};

export const Combined: Story = {
  args: {
    data: {
      error: "Validation failed",
      fieldErrors: {
        name: ["Name is required"],
      },
    },
  },
};

export const Empty: Story = {
  args: {
    data: null,
  },
};
