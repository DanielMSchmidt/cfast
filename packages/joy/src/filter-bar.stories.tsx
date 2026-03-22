import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router";
import { FilterBar } from "./filter-bar.js";
import type { FilterDef } from "@cfast/ui";

const STATUS_OPTIONS: FilterDef = {
  column: "status",
  type: "select",
  label: "Status",
  options: [
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ],
};

const AUTHOR_OPTIONS: FilterDef = {
  column: "author",
  type: "select",
  label: "Author",
  options: [
    { label: "Alice Chen", value: "alice" },
    { label: "Bob Smith", value: "bob" },
    { label: "Carol Diaz", value: "carol" },
  ],
};

const TITLE_FILTER: FilterDef = {
  column: "title",
  type: "text",
  label: "Title",
  placeholder: "Filter by title\u2026",
};

const withRouter = (Story: () => React.ReactElement) => (
  <MemoryRouter initialEntries={["/posts"]}>
    <Story />
  </MemoryRouter>
);

const meta = {
  title: "Joy/FilterBar",
  component: FilterBar,
  decorators: [withRouter],
  parameters: { layout: "padded" },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchOnly: Story = {
  args: {
    filters: [],
    searchable: ["title", "author"],
  },
};

export const SelectFilters: Story = {
  args: {
    filters: [STATUS_OPTIONS, AUTHOR_OPTIONS],
  },
};

export const SearchAndSelectFilters: Story = {
  args: {
    filters: [STATUS_OPTIONS, AUTHOR_OPTIONS],
    searchable: ["title"],
  },
};

export const TextFilter: Story = {
  args: {
    filters: [TITLE_FILTER],
  },
};

export const MixedFilters: Story = {
  args: {
    filters: [STATUS_OPTIONS, TITLE_FILTER],
    searchable: ["title", "author"],
  },
};

export const Empty: Story = {
  args: {
    filters: [],
  },
};
