import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { DetailView } from "./detail-view.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type Post = {
  id: number;
  title: string;
  author: string;
  status: string;
  publishedAt: string | null;
  views: number;
  content: string;
  slug: string;
};

const POST: Post = {
  id: 42,
  title: "Getting started with Cloudflare Workers",
  author: "Alice",
  status: "published",
  publishedAt: "2024-01-15",
  views: 1240,
  content: "This post walks through deploying your first Worker...",
  slug: "getting-started-cloudflare-workers",
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
};

const USER: User = {
  id: "usr_01abc",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
  createdAt: "2023-06-01",
  lastLoginAt: "2024-03-10",
  isActive: true,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DetailView> = {
  title: "Joy/DetailView",
  component: DetailView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Infers all fields automatically from the record shape. */
export const InferredFields: Story = {
  args: {
    title: "Post #42",
    record: POST,
  },
};

/** Explicit fields list controls which fields are shown and in what order. */
export const ExplicitFields: Story = {
  args: {
    title: "Post #42",
    record: POST,
    fields: [
      { key: "title", label: "Title" },
      { key: "author", label: "Author" },
      { key: "status", label: "Status" },
      { key: "publishedAt", label: "Published At" },
      { key: "views", label: "Views" },
    ],
  },
};

/** Shorthand string fields (key names only — labels are auto-derived). */
export const ShorthandFields: Story = {
  args: {
    title: "Post #42",
    record: POST,
    fields: ["title", "author", "status", "slug"],
  },
};

/** Exclude specific keys when inferring fields from the record. */
export const WithExclude: Story = {
  args: {
    title: "Post #42",
    record: POST,
    exclude: ["id", "content", "slug"],
  },
};

/** Custom render function for a field value. */
export const WithCustomRender: Story = {
  args: {
    title: "Post #42",
    record: POST,
    fields: [
      { key: "title", label: "Title" },
      { key: "author", label: "Author" },
      {
        key: "status",
        label: "Status",
        render: (value: unknown) => (
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 4,
              background: value === "published" ? "#d1fae5" : "#fef9c3",
              color: value === "published" ? "#065f46" : "#92400e",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {String(value)}
          </span>
        ),
      },
      { key: "views", label: "Views", render: (v: unknown) => (v as number).toLocaleString() },
    ],
  },
};

/** Different record shape — a user profile detail view. */
export const UserRecord: Story = {
  args: {
    title: "User: Alice Johnson",
    record: USER,
    fields: [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email Address" },
      { key: "role", label: "Role" },
      { key: "isActive", label: "Active" },
      { key: "createdAt", label: "Created" },
      { key: "lastLoginAt", label: "Last Login" },
    ],
  },
};

export const WithBreadcrumb: Story = {
  args: {
    title: "Post #42",
    record: POST,
    fields: ["title", "author", "status", "publishedAt"],
    breadcrumb: [
      { label: "Home", to: "/" },
      { label: "Posts", to: "/posts" },
    ],
  },
};

/** Null / missing values render gracefully as em-dash. */
export const WithNullValues: Story = {
  args: {
    title: "Draft Post",
    record: { ...POST, publishedAt: null, views: 0 },
    fields: ["title", "author", "status", "publishedAt", "views"],
  },
};
