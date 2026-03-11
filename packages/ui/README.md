# @cfast/ui

**Advanced component library for cfast. Data tables, page shells, permission-aware actions, and file uploads — all wired to the framework.**

`@cfast/ui` sits between your primitive component library (MUI Joy UI) and your application code. It provides the "smart" components that integrate with `@cfast/db`, `@cfast/actions`, `@cfast/permissions`, `@cfast/pagination`, `@cfast/auth`, and `@cfast/storage`. The headless core provides hooks and logic. UI library plugins provide the styled implementations.

## Why This Exists

Primitive component libraries give you buttons, inputs, and cards. But every data-driven app ends up building the same things on top of them: sortable tables with pagination, filter bars that sync with the URL, page shells with breadcrumbs and action toolbars, file upload drop zones, toast notifications on action completion.

These patterns are not app-specific — they're framework-level. And in cfast, they're even more useful because they can integrate with the permission system, the pagination hooks, the storage schema, and the action pipeline automatically.

`@cfast/ui` provides these components so that `@cfast/admin` doesn't have to reinvent them (admin is a thin auto-generation layer on top of UI), and so that application code outside the admin panel can reuse the same patterns.

## Design Decisions and Their Rationale

### Why not keep this narrow (just ActionButton/PermissionGate)?

The original design scoped `@cfast/ui` to permission-aware wrappers only. In practice, the example app revealed that every route hand-codes the same data tables, empty states, date formatting, filter bars, and user menus. These patterns all benefit from cfast integration:

- A data table that accepts a `usePagination()` result and column definitions from a Drizzle schema
- A filter bar that serializes to URL search params and feeds into `@cfast/pagination` loaders
- An empty state that shows a "Create" CTA only when the user has permission
- A user menu that reads from `@cfast/auth` and displays role badges from `@cfast/permissions`

Keeping these in separate packages (or leaving them to apps) means the integrations get reimplemented in every project.

### Why does @cfast/admin use @cfast/ui instead of having its own components?

Admin's job is **schema introspection → configuration**: it reads your Drizzle schema and generates the config for list views, detail views, and forms. The actual rendering is UI's job. This means:

- Apps that don't use the admin panel still get data tables, list views, and detail views
- Custom admin overrides use the same components as the rest of the app
- Admin stays thin and focused on auto-generation

### Headless core + plugins

Same architecture as before, expanded to cover all component categories. The headless core (`@cfast/ui`) provides hooks, logic, and unstyled components. The Joy UI plugin (`@cfast/ui/joy`) provides styled implementations. Third-party plugins can add shadcn, Mantine, or any other library.

The plugin contract maps component slots to implementations:

```typescript
createUIPlugin({
  components: {
    // Actions
    button: MyButton,
    tooltip: MyTooltip,
    confirmDialog: MyConfirmDialog,
    // Data display
    table: MyTable,
    tableHead: MyTableHead,
    tableBody: MyTableBody,
    tableRow: MyTableRow,
    tableCell: MyTableCell,
    chip: MyChip,
    // Layout
    appShell: MyAppShell,
    sidebar: MySidebar,
    pageContainer: MyPageContainer,
    breadcrumb: MyBreadcrumb,
    // Feedback
    toast: MyToast,
    alert: MyAlert,
    // File
    dropZone: MyDropZone,
  },
});
```

Plugins only need to implement the slots they care about. Missing slots fall back to the headless defaults (unstyled HTML elements).

---

## Data Display

### `<DataTable>`

A table component that integrates with `@cfast/pagination`, `@cfast/db`, `@cfast/permissions`, and `@cfast/actions`.

```typescript
import { DataTable } from "@cfast/ui/joy";
import { usePagination } from "@cfast/pagination/client";
import { posts } from "~/db/schema";

function PostsTable() {
  const pagination = usePagination<Post>();

  return (
    <DataTable
      data={pagination}
      table={posts}
      columns={["title", "author", "status", "createdAt"]}
      actions={composed.client}
      selectable
    />
  );
}
```

**Features:**

| Feature | How it works |
|---|---|
| **Column inference** | Pass a Drizzle `table` — columns, types, and labels are derived from the schema. Override with the `columns` prop. |
| **Sorting** | Click column headers. Sort state syncs to URL search params via React Router. |
| **Row actions** | Pass `actions` from `@cfast/actions`. Each row gets an action menu. Actions are hidden/disabled based on permissions. |
| **Selection** | `selectable` enables row checkboxes. Selected rows feed into `<BulkActionBar>`. |
| **Typed cell rendering** | Column types determine the renderer: dates use `<DateField>`, booleans use `<BooleanField>`, etc. Override per-column with `render`. |
| **Loading state** | Shows skeleton rows while data is loading. |
| **Responsive** | Horizontal scroll on small screens. Priority columns stay visible. |

**Column configuration:**

```typescript
<DataTable
  data={pagination}
  table={posts}
  columns={[
    "title",                                          // string shorthand
    { key: "author", label: "Written by" },           // custom label
    { key: "published", render: (v) => v ? "Live" : "Draft" },  // custom render
    { key: "createdAt", sortable: false },            // disable sorting
  ]}
/>
```

### `<FilterBar>`

URL-synced filter controls. Column types from Drizzle schema determine the filter input type.

```typescript
import { FilterBar } from "@cfast/ui/joy";
import { posts } from "~/db/schema";

function PostFilters() {
  return (
    <FilterBar
      table={posts}
      filters={[
        { column: "published", type: "select", options: [
          { label: "Published", value: true },
          { label: "Draft", value: false },
        ]},
        { column: "authorId", type: "relation", table: users, display: "name" },
        { column: "createdAt", type: "dateRange" },
      ]}
      searchable={["title", "content"]}
    />
  );
}
```

**How it works:**

1. Each filter serializes its state to URL search params (e.g., `?published=true&author=abc`)
2. In the loader, `@cfast/pagination`'s `parseParams()` reads these params
3. The loader applies them as Drizzle `where` clauses
4. On filter change, React Router navigates with the new params — no client state management

**Filter types:**

| Type | Input | Serialization |
|---|---|---|
| `text` | Text input | `?column=value` |
| `select` | Dropdown/chip group | `?column=value` |
| `multiSelect` | Multi-select dropdown | `?column=a,b,c` |
| `relation` | Async select (fetches related records) | `?column=id` |
| `dateRange` | Date range picker | `?column_from=...&column_to=...` |
| `boolean` | Toggle/chip | `?column=true` |
| `number` | Number range inputs | `?column_min=...&column_max=...` |

### TypedField Components

Read-only display components that format values based on their type. Used by `<DataTable>` cell renderers and `<DetailView>` field layouts.

```typescript
import { DateField, BooleanField, EmailField, ImageField, RelationField } from "@cfast/ui/joy";

<DateField value={post.createdAt} format="relative" />
// → "3 days ago"

<DateField value={post.createdAt} format="short" />
// → "Mar 11, 2026"

<BooleanField value={post.published} trueLabel="Published" falseLabel="Draft" />
// → Colored chip: "Published" (green) or "Draft" (neutral)

<EmailField value={user.email} />
// → Clickable mailto link

<ImageField value={post.coverImageKey} storage={storageConfig} />
// → Renders image from storage, handles signed URLs

<RelationField value={post.author} display="name" linkTo="/users/:id" />
// → Linked text showing the related record's display field
```

**Available fields:**

| Field | Renders | Options |
|---|---|---|
| `TextField` | Plain text, truncated with tooltip | `maxLength`, `copyable` |
| `NumberField` | Formatted number | `locale`, `currency`, `decimals` |
| `BooleanField` | Chip/badge | `trueLabel`, `falseLabel`, `trueColor`, `falseColor` |
| `DateField` | Formatted date/time | `format: "short" \| "long" \| "relative" \| "datetime"` |
| `EmailField` | Mailto link | — |
| `UrlField` | External link with icon | `truncate` |
| `ImageField` | Image thumbnail | `width`, `height`, `storage` (for signed URLs) |
| `FileField` | File icon + name + size | `storage` |
| `RelationField` | Display field from related record | `display`, `linkTo` |
| `JsonField` | Formatted JSON | `collapsed` |

### `<EmptyState>`

Permission-aware empty state. Shows different content based on whether the user can create records.

```typescript
import { EmptyState } from "@cfast/ui/joy";

<EmptyState
  title="No posts yet"
  description="Create your first blog post to get started."
  createAction={createPost.client}
  createLabel="New Post"
  icon={DocumentIcon}
/>
```

- If `createAction` is permitted → shows the CTA button
- If `createAction` is not permitted → shows only the title and description
- If `createAction` is invisible (no relation at all) → shows a generic "Nothing here" message

---

## Page Shells

### `<ListView>`

A full page layout combining title, filters, data table, pagination, and empty state. This is the component `@cfast/admin` uses for every table view.

```typescript
import { ListView } from "@cfast/ui/joy";

function PostsPage() {
  const pagination = useOffsetPagination<Post>();

  return (
    <ListView
      title="Blog Posts"
      data={pagination}
      table={posts}
      columns={["title", "author", "published", "createdAt"]}
      actions={composed.client}
      filters={[
        { column: "published", type: "select", options: publishedOptions },
      ]}
      searchable={["title", "content"]}
      createAction={createPost.client}
      selectable
      bulkActions={[
        { label: "Delete", action: bulkDelete.client, confirmation: "Delete selected posts?" },
        { label: "Publish", action: bulkPublish.client },
      ]}
    />
  );
}
```

`<ListView>` composes `<PageContainer>`, `<FilterBar>`, `<DataTable>`, pagination controls, `<EmptyState>`, and `<BulkActionBar>`. It handles the loading/empty/data state transitions automatically.

### `<DetailView>`

A read-only detail page for a single record. Auto-lays out fields based on Drizzle column types.

```typescript
import { DetailView } from "@cfast/ui/joy";

function PostDetail({ post }: { post: Post }) {
  return (
    <DetailView
      title={post.title}
      table={posts}
      record={post}
      fields={["title", "content", "author", "published", "createdAt", "updatedAt"]}
      actions={composed.client}
    />
  );
}
```

**Features:**

- Fields render using the appropriate `TypedField` based on column type
- Action toolbar at the top (edit, delete, custom actions — permission-aware)
- Override individual fields: `fields={[..., { key: "content", render: (v) => <Markdown>{v}</Markdown> }]}`
- Exclude fields: `exclude={["id", "authorId"]}`

### `<AppShell>`

Base layout with sidebar navigation, header, and content area.

```typescript
import { AppShell } from "@cfast/ui/joy";

function Layout({ children }) {
  return (
    <AppShell
      sidebar={<AppShell.Sidebar items={navigationItems} />}
      header={<AppShell.Header userMenu={<UserMenu />} />}
    >
      {children}
    </AppShell>
  );
}
```

**Sidebar navigation** can filter items based on permissions:

```typescript
const navigationItems = [
  { label: "Posts", to: "/posts", icon: DocumentIcon },
  { label: "Users", to: "/users", icon: UsersIcon, action: manageUsers.client },
  //                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                           Only shown if the user has permission for this action
];
```

### `<PageContainer>`

Page wrapper with title, breadcrumb, tabs, and action toolbar. Used by `<ListView>` and `<DetailView>` internally, but also useful standalone.

```typescript
import { PageContainer } from "@cfast/ui/joy";

<PageContainer
  title="Edit Post"
  breadcrumb={[
    { label: "Posts", to: "/posts" },
    { label: post.title },
  ]}
  actions={<ActionButton action={deletePost} input={{ postId }} />}
>
  {/* page content */}
</PageContainer>
```

### `<UserMenu>`

Header dropdown showing current user info, role badge, and auth actions.

```typescript
import { UserMenu } from "@cfast/ui/joy";

<UserMenu
  // Reads user from @cfast/auth's useCurrentUser()
  // Automatically shows:
  // - Avatar with initials fallback
  // - Name and email
  // - Role badge
  // - Impersonation indicator (if impersonating)
  // - Links: Profile, Settings (configurable)
  // - Sign out
  links={[
    { label: "Profile", to: "/profile" },
    { label: "Admin", to: "/admin", action: adminAccess.client },
  ]}
/>
```

### `<NavigationProgress>`

Thin progress bar at the top of the page during React Router navigation.

```typescript
import { NavigationProgress } from "@cfast/ui/joy";

// In your root layout:
<NavigationProgress />
```

Uses `useNavigation().state` from React Router. Shows on `loading`, hides on `idle`. No configuration needed.

---

## Actions & Feedback

### `<ActionButton>`

Permission-aware button wrapping a `@cfast/actions` action. *Already implemented in PR #6.*

```typescript
import { ActionButton } from "@cfast/ui/joy";

<ActionButton
  action={publishPost}
  input={{ postId }}
  whenForbidden="disable"    // "hide" | "disable" | "show"
  confirmation="Publish this post?"
>
  Publish
</ActionButton>
```

### `<PermissionGate>`

Conditionally renders children based on action permissions. *Already implemented in PR #6.*

```typescript
<PermissionGate action={editPost} input={{ postId }} fallback={<ReadOnlyBanner />}>
  <EditToolbar />
</PermissionGate>
```

### `<ConfirmDialog>`

Standalone confirmation dialog. Used internally by `<ActionButton>` when `confirmation` is set, but also available directly.

```typescript
import { ConfirmDialog, useConfirm } from "@cfast/ui/joy";

function DangerZone() {
  const confirm = useConfirm();

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete account",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (confirmed) { /* proceed */ }
  }

  return <Button onClick={handleDelete}>Delete Account</Button>;
}
```

### `useToast()` and `<ToastProvider>`

Action result notifications. Wraps a toast library (Sonner for Joy UI plugin) with cfast-aware defaults.

```typescript
import { ToastProvider, useToast } from "@cfast/ui/joy";

// In root layout:
<ToastProvider />

// In components — manual usage:
const toast = useToast();
toast.success("Post published");
toast.error("Failed to delete post");

// Automatic: useActionToast wires to @cfast/actions results
import { useActionToast } from "@cfast/ui";

useActionToast(composed.client, {
  deletePost: { success: "Post deleted", error: "Failed to delete" },
  publishPost: { success: "Post published" },
});
```

### `<FormStatus>`

Displays action result feedback (success/error messages) in a consistent format.

```typescript
import { FormStatus } from "@cfast/ui/joy";

function EditForm() {
  const actionData = useActionData();

  return (
    <Form method="post">
      <FormStatus data={actionData} />
      {/* form fields */}
    </Form>
  );
}
```

Renders success messages as green alerts, error messages as red alerts, and validation errors as a field-keyed list. Replaces the hand-coded `<Box sx={{ bgcolor: "danger.softBg" }}>` pattern repeated throughout the example app.

### `<BulkActionBar>`

Toolbar that appears when rows are selected in a `<DataTable>`. Shows selected count and permitted bulk actions.

```typescript
<BulkActionBar
  selected={selectedRows}
  actions={[
    { label: "Delete", action: bulkDelete.client, confirmation: "Delete {count} posts?" },
    { label: "Publish", action: bulkPublish.client },
    { label: "Export CSV", handler: (rows) => exportCsv(rows) },
  ]}
  onClear={() => clearSelection()}
/>
```

Actions are permission-aware — hidden if the user can't perform them.

---

## File Display

### `<DropZone>`

Drag-and-drop file upload area. Integrates with `@cfast/storage`'s schema for validation and `useUpload` for upload progress.

```typescript
import { DropZone } from "@cfast/ui/joy";
import { useUpload } from "@cfast/storage/client";

function CoverImageUpload() {
  const upload = useUpload("postCoverImage");

  return (
    <DropZone
      upload={upload}
      // Inherits accept and maxSize from storage schema
      // Shows: drag state, file preview, validation errors, upload progress
    />
  );
}
```

**States:**

| State | Display |
|---|---|
| Idle | Dashed border, "Drag files here or click to browse" |
| Drag over (valid) | Highlighted border, "Drop to upload" |
| Drag over (invalid) | Red border, "File type not accepted" |
| Uploading | Progress bar, file name, cancel button |
| Complete | File preview (image thumbnail or file icon + name) |
| Error | Red alert with error message, retry button |

### `<ImagePreview>`

Displays an image from `@cfast/storage` with signed URL handling.

```typescript
import { ImagePreview } from "@cfast/ui/joy";

<ImagePreview
  fileKey={post.coverImageKey}
  storage={storageConfig}
  width={200}
  height={150}
  fallback={<PlaceholderImage />}
/>
```

### `<FileList>`

A list of uploaded files with metadata, download links, and delete actions.

```typescript
import { FileList } from "@cfast/ui/joy";

<FileList
  files={post.attachments}
  storage={storageConfig}
  deleteAction={deleteAttachment.client}
  // Shows: file icon, name, size, download link, delete button (permission-aware)
/>
```

---

## Utilities

### `<AvatarWithInitials>`

Avatar component with automatic initials fallback when no image is available.

```typescript
import { AvatarWithInitials } from "@cfast/ui/joy";

<AvatarWithInitials
  src={user.avatarUrl}
  name={user.name}
  size="sm"
/>
// Shows image if src is available, otherwise shows "DS" for "Daniel Schmidt"
```

### `<RoleBadge>`

Colored badge displaying a user's role. Colors configurable per role.

```typescript
import { RoleBadge } from "@cfast/ui/joy";

<RoleBadge role={user.role} />
// → Colored chip: "Admin" (red), "Editor" (blue), "Reader" (neutral)

// Custom colors:
<RoleBadge
  role={user.role}
  colors={{ admin: "danger", editor: "primary", reader: "neutral" }}
/>
```

### `<ImpersonationBanner>`

Persistent banner shown when an admin is impersonating another user.

```typescript
import { ImpersonationBanner } from "@cfast/ui/joy";

// In root layout:
<ImpersonationBanner />
// Shows: "Viewing as user@example.com" with a "Stop Impersonating" button
// Hidden when not impersonating
// Reads impersonation state from @cfast/auth
```

---

## Architecture

```
@cfast/ui (headless core)
├── Hooks
│   ├── useActionStatus          — permission status for a single action
│   ├── useToast                 — toast notification imperative API
│   ├── useActionToast           — auto-toast on action results
│   ├── useConfirm               — imperative confirmation dialog
│   └── useColumnInference       — derive columns from Drizzle schema
│
├── Headless components
│   ├── PermissionGate           — conditional render on permissions
│   ├── EmptyState               — permission-aware empty state logic
│   └── BulkActionBar            — selection + action permission logic
│
├── Typed fields (headless)
│   ├── DateField, BooleanField, NumberField, TextField
│   ├── EmailField, UrlField, ImageField, FileField
│   ├── RelationField, JsonField
│   └── fieldForColumn()         — maps Drizzle column type → field component
│
└── Plugin API
    └── createUIPlugin()         — maps component slots to implementations

@cfast/ui/joy (MUI Joy UI plugin)
├── All of the above, styled with Joy UI
├── DataTable                    — Joy Table + sorting + selection
├── FilterBar                    — Joy Input/Select/DatePicker filters
├── ListView                     — composed page shell
├── DetailView                   — composed detail page
├── AppShell                     — Joy sidebar + header layout
├── PageContainer                — title + breadcrumb + actions wrapper
├── UserMenu                     — Joy Dropdown + Avatar + Menu
├── NavigationProgress           — thin progress bar
├── ActionButton                 — Joy Button + Tooltip + loading
├── ConfirmDialog                — Joy Modal
├── ToastProvider                — Sonner integration
├── FormStatus                   — Joy Alert for action results
├── DropZone                     — drag-and-drop upload area
├── ImagePreview                 — image display with signed URLs
├── FileList                     — file list with actions
├── AvatarWithInitials           — Joy Avatar + initials
├── RoleBadge                    — Joy Chip with role colors
└── ImpersonationBanner          — Joy Alert banner
```

## Exports

Server/shared (`@cfast/ui`):

```typescript
// Hooks
export { useActionStatus } from "./hooks/use-action-status.js";
export { useToast, useActionToast } from "./hooks/use-toast.js";
export { useConfirm } from "./hooks/use-confirm.js";
export { useColumnInference } from "./hooks/use-column-inference.js";

// Headless components
export { PermissionGate } from "./components/permission-gate.js";
export { EmptyState } from "./components/empty-state.js";
export { BulkActionBar } from "./components/bulk-action-bar.js";

// Typed fields
export {
  DateField, BooleanField, NumberField, TextField,
  EmailField, UrlField, ImageField, FileField,
  RelationField, JsonField, fieldForColumn,
} from "./fields/index.js";

// Plugin API
export { createUIPlugin } from "./plugin.js";

// Types
export type {
  UIPlugin, DataTableProps, FilterBarProps, ListViewProps,
  DetailViewProps, FieldProps, ColumnDef, FilterDef,
} from "./types.js";
```

Joy UI plugin (`@cfast/ui/joy`):

```typescript
export {
  // Data display
  DataTable, FilterBar, ListView, DetailView,
  // Layout
  AppShell, PageContainer, UserMenu, NavigationProgress,
  // Actions & feedback
  ActionButton, PermissionGate, ConfirmDialog,
  ToastProvider, FormStatus, BulkActionBar,
  // File
  DropZone, ImagePreview, FileList,
  // Utilities
  AvatarWithInitials, RoleBadge, ImpersonationBanner,
} from "./joy/index.js";
```

## Integration with Other @cfast Packages

- **`@cfast/actions`** — `ActionButton`, `PermissionGate`, `BulkActionBar`, `useActionToast` all consume action descriptors and permission status from `useActions()`.
- **`@cfast/permissions`** — Permission status drives hide/disable/show behavior. Sidebar navigation filters items by permission. `EmptyState` adapts its CTA based on create permissions.
- **`@cfast/pagination`** — `DataTable` and `ListView` accept pagination hook results (`usePagination`, `useOffsetPagination`, `useInfiniteScroll`). `FilterBar` serializes to URL params that `parseParams()` reads.
- **`@cfast/db`** — Drizzle schema metadata drives column inference in `DataTable`, filter type inference in `FilterBar`, and field type inference in `DetailView`. `useColumnInference()` maps Drizzle column types to field components.
- **`@cfast/auth`** — `UserMenu` reads `useCurrentUser()`. `ImpersonationBanner` reads impersonation state. `RoleBadge` displays role names.
- **`@cfast/storage`** — `DropZone` integrates with `useUpload()`. `ImagePreview` and `FileList` use storage URLs. `ImageField` resolves signed URLs from storage config.
- **`@cfast/forms`** — `FormStatus` displays validation errors from form submissions. `ListView`'s create flow can open an `AutoForm` modal.
- **`@cfast/admin`** — Admin uses `ListView`, `DetailView`, `DataTable`, `FilterBar`, `AppShell`, and all other UI components. Admin's job is schema → config, UI's job is config → pixels.
