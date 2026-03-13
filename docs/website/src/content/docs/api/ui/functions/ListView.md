---
editUrl: false
next: false
prev: false
title: "ListView"
---

> **ListView**\<`T`\>(`props`): `Element`

Defined in: [packages/ui/src/components/list-view.tsx:45](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/list-view.tsx#L45)

Full-page list layout composing filters, data table, pagination, and empty state.

Combines [PageContainer](/api/ui/functions/pagecontainer/), [FilterBar](/api/ui/functions/filterbar/), [DataTable](/api/ui/functions/datatable/),
[EmptyState](/api/ui/functions/emptystate/), [BulkActionBar](/api/ui/functions/bulkactionbar/), and pagination controls into a
single component. This is the primary component used by `@cfast/admin` for
every table view, but it is equally useful in application code.

Supports both offset-based pagination (page numbers) and cursor-based pagination
(load more). The `createAction` prop controls the visibility of the "Create" button
via permission checks.

## Type Parameters

### T

`T` = `unknown`

The row data type.

## Parameters

### props

[`ListViewProps`](/api/ui/type-aliases/listviewprops/)\<`T`\>

See [ListViewProps](/api/ui/type-aliases/listviewprops/).

## Returns

`Element`

## Example

```tsx
const pagination = useOffsetPagination<Post>();

<ListView
  title="Blog Posts"
  data={pagination}
  columns={["title", "author", "published", "createdAt"]}
  filters={[{ column: "published", type: "select", options: publishedOptions }]}
  searchable={["title", "content"]}
  createAction={createPost.client}
  selectable
  bulkActions={[
    { label: "Delete", handler: (rows) => bulkDelete(rows) },
  ]}
/>
```
