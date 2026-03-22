import type { Meta, StoryObj } from "@storybook/react";
import { ImagePreview } from "./image-preview.js";

const meta = {
  title: "Joy/ImagePreview",
  component: ImagePreview,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ImagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSrc: Story = {
  args: {
    src: "https://picsum.photos/seed/cfast/200/200",
    alt: "Sample image",
    width: 200,
    height: 200,
  },
};

export const WithFileKey: Story = {
  args: {
    fileKey: "uploads/photo.png",
    getUrl: (key: string) => `https://cdn.example.com/${key}`,
    alt: "Image from storage key",
    width: 200,
    height: 200,
  },
};

export const NoImage: Story = {
  args: {
    src: null,
    alt: "No image available",
    width: 200,
    height: 200,
  },
};

export const WideAspectRatio: Story = {
  args: {
    src: "https://picsum.photos/seed/wide/400/200",
    alt: "Wide banner image",
    width: 400,
    height: 200,
  },
};

export const SmallThumbnail: Story = {
  args: {
    src: "https://picsum.photos/seed/thumb/80/80",
    alt: "Thumbnail",
    width: 80,
    height: 80,
  },
};
