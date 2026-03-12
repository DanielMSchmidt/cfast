import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./data-table.js";
import type { ColumnDef } from "../types.js";

type Post = {
  id: number;
  title: string;
  author: string;
  status: string;
  publishedAt: string | null;
  views: number;
};

const POSTS: Post[] = [
  { id: 1, title: "Getting Started with Cloudflare Workers", author: "Alice Chen", status: "published", publishedAt: "2025-11-01", views: 4821 },
  { id: 2, title: "Drizzle ORM on D1: A Practical Guide", author: "Bob Smith", status: "published", publishedAt: "2025-11-15", views: 3102 },
  { id: 3, title: "React Router v7 File-Based Routing", author: "Alice Chen", status: "draft", publishedAt: null, views: 0 },
  { id: 4, title: "Building Passkey Auth with Better Auth", author: "Carol Diaz", status: "published", publishedAt: "2025-12-03", views: 2750 },
  { id: 5, title: "Edge-First Monorepos with pnpm + Turborepo", author: "Bob Smith", status: "archived", publishedAt: "2025-09-20", views: 1340 },
];

const COLUMNS: ColumnDef<Post>[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "author", label: "Author", sortable: true },
  { key: "status", label: "Status", sortable: true },
  {
    key: "publishedAt",
    label: "Published",
    sortable: true,
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "views",
    label: "Views",
    sortable: true,
    render: (value) => Number(value).toLocaleString(),
  },
];

const meta = {
  title: "Joy/DataTable",
  component: DataTable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { items: POSTS },
    columns: COLUMNS,
  },
};

export const Selectable: Story = {
  args: {
    data: { items: POSTS },
    columns: COLUMNS,
    selectable: true,
  },
};

export const ClickableRows: Story = {
  args: {
    data: { items: POSTS },
    columns: COLUMNS,
    onRowClick: (row) => alert(`Clicked: ${(row as Post).title}`),
  },
};

export const SelectableAndClickable: Story = {
  args: {
    data: { items: POSTS },
    columns: COLUMNS,
    selectable: true,
    onRowClick: (row) => alert(`Clicked: ${(row as Post).title}`),
  },
};

export const ShorthandColumns: Story = {
  args: {
    data: { items: POSTS },
    columns: ["title", "author", "status"],
  },
};

export const Empty: Story = {
  args: {
    data: { items: [] },
    columns: COLUMNS,
    emptyMessage: "No posts found. Create your first post to get started.",
  },
};

export const Loading: Story = {
  args: {
    data: { items: [], isLoading: true },
    columns: COLUMNS,
  },
};
