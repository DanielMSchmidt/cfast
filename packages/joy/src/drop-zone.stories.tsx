import type { Meta, StoryObj } from "@storybook/react";
import { DropZone } from "./drop-zone.js";

const meta = {
  title: "Joy/DropZone",
  component: DropZone,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

const idleUpload = {
  accept: "image/*",
  start: (_file: File) => {},
  progress: 0,
  isUploading: false,
  result: null,
  error: null,
  validationError: null,
  reset: () => {},
};

export const Idle: Story = {
  args: {
    upload: idleUpload,
  },
};

export const MultipleFiles: Story = {
  args: {
    upload: { ...idleUpload, accept: ".pdf,.doc,.docx" },
    multiple: true,
  },
};

export const Uploading: Story = {
  args: {
    upload: {
      ...idleUpload,
      isUploading: true,
      progress: 42,
    },
  },
};

export const UploadComplete: Story = {
  args: {
    upload: {
      ...idleUpload,
      result: { key: "uploads/photo.png", url: "https://example.com/photo.png" },
    },
  },
};

export const WithError: Story = {
  args: {
    upload: {
      ...idleUpload,
      error: "Upload failed. Please try again.",
    },
  },
};

export const WithValidationError: Story = {
  args: {
    upload: {
      ...idleUpload,
      validationError: "File must be smaller than 5 MB.",
    },
  },
};
