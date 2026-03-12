import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { ListView } from "./list-view.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type Post = {
  id: number;
  title: string;
  author: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  views: number;
};

const POSTS: Post[] = [
  { id: 1, title: "Getting started with Cloudflare Workers", author: "Alice", status: "published", publishedAt: "2024-01-15", views: 1240 },
  { id: 2, title: "Building type-safe APIs with Drizzle ORM", author: "Bob", status: "published", publishedAt: "2024-02-03", views: 875 },
  { id: 3, title: "React Router v7 file-based routing", author: "Alice", status: "draft", publishedAt: null, views: 0 },
  { id: 4, title: "Passkey authentication with Better Auth", author: "Carol", status: "published", publishedAt: "2024-03-10", views: 2300 },
  { id: 5, title: "Deploying D1 databases at the edge", author: "Bob", status: "archived", publishedAt: "2023-11-20", views: 410 },
];

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "status", label: "Status" },
  {
    key: "views",
    label: "Views",
    render: (value: unknown) => (value as number).toLocaleString(),
  },
];

const STATUS_FILTER = {
  column: "status",
  type: "select" as const,
  label: "Status",
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ],
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: "Joy/ListView",
  component: ListView,
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
} satisfies Meta<typeof ListView>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    title: "Posts",
    data: { items: POSTS },
    columns: COLUMNS,
  },
};

export const WithFiltersAndSearch: Story = {
  args: {
    title: "Posts",
    data: { items: POSTS },
    columns: COLUMNS,
    filters: [STATUS_FILTER],
    searchable: ["title", "author"],
  },
};

export const WithOffsetPagination: Story = {
  args: {
    title: "Posts",
    data: {
      items: POSTS.slice(0, 3),
      total: POSTS.length,
      totalPages: 2,
      currentPage: 1,
      goToPage: () => {},
    },
    columns: COLUMNS,
  },
};

export const WithCursorPagination: Story = {
  args: {
    title: "Posts",
    data: {
      items: POSTS.slice(0, 3),
      hasMore: true,
      loadMore: () => {},
    },
    columns: COLUMNS,
  },
};

export const Selectable: Story = {
  args: {
    title: "Posts",
    data: { items: POSTS },
    columns: COLUMNS,
    selectable: true,
    bulkActions: [
      { label: "Publish", handler: (rows) => console.log("Publish", rows) },
      { label: "Archive", handler: (rows) => console.log("Archive", rows) },
    ],
  },
};

export const Loading: Story = {
  args: {
    title: "Posts",
    data: { items: [], isLoading: true },
    columns: COLUMNS,
  },
};

export const Empty: Story = {
  args: {
    title: "Posts",
    data: { items: [] },
    columns: COLUMNS,
  },
};

export const EmptyWithFilters: Story = {
  args: {
    title: "Posts",
    data: { items: [] },
    columns: COLUMNS,
    filters: [STATUS_FILTER],
  },
};

export const WithBreadcrumb: Story = {
  args: {
    title: "Posts",
    data: { items: POSTS },
    columns: COLUMNS,
    breadcrumb: [
      { label: "Home", to: "/" },
      { label: "Blog", to: "/blog" },
    ],
  },
};
