import type { Meta, StoryObj } from "@storybook/react";
import { FileList } from "./file-list.js";
import type { FileListFile } from "../types.js";

const meta = {
  title: "Joy/FileList",
  component: FileList,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FileList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFiles: FileListFile[] = [
  {
    key: "uploads/report-2024.pdf",
    name: "report-2024.pdf",
    size: 1_234_567,
    type: "application/pdf",
    url: "https://example.com/uploads/report-2024.pdf",
  },
  {
    key: "uploads/logo.png",
    name: "logo.png",
    size: 48_210,
    type: "image/png",
    url: "https://example.com/uploads/logo.png",
  },
  {
    key: "uploads/notes.txt",
    name: "notes.txt",
    size: 512,
    type: "text/plain",
  },
];

export const WithFiles: Story = {
  args: {
    files: sampleFiles,
  },
};

export const WithDownload: Story = {
  args: {
    files: sampleFiles,
    onDownload: (file: FileListFile) => {
      alert(`Downloading: ${file.name}`);
    },
  },
};

export const Empty: Story = {
  args: {
    files: [],
  },
};

export const SingleFile: Story = {
  args: {
    files: [sampleFiles[0]],
  },
};

export const WithoutSizes: Story = {
  args: {
    files: sampleFiles.map(({ size: _size, ...rest }) => rest),
  },
};
