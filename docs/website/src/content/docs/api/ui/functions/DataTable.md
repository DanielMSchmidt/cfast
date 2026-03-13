---
editUrl: false
next: false
prev: false
title: "DataTable"
---

> **DataTable**\<`T`\>(`props`): `Element`

Defined in: [packages/ui/src/components/data-table.tsx:44](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/data-table.tsx#L44)

Data table with column sorting, row selection, and pluggable cell rendering.

Renders via the UI plugin's table slots (`table`, `tableHead`, `tableBody`,
`tableRow`, `tableCell`). Accepts column definitions as strings (auto-labeled)
or full [ColumnDef](/api/ui/type-aliases/columndef/) objects for custom labels, sorting, and renderers.

Integrates with `@cfast/pagination` hook results for paginated data and with
`@cfast/actions` for row-level actions.

## Type Parameters

### T

`T` = `unknown`

The row data type.

## Parameters

### props

[`DataTableProps`](/api/ui/type-aliases/datatableprops/)\<`T`\>

See [DataTableProps](/api/ui/type-aliases/datatableprops/).

## Returns

`Element`

## Example

```tsx
const pagination = usePagination<Post>();

<DataTable
  data={pagination}
  columns={["title", "author", { key: "createdAt", sortable: false }]}
  selectable
  onRowClick={(row) => navigate(`/posts/${row.id}`)}
/>
```
