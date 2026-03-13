---
editUrl: false
next: false
prev: false
title: "BulkActionBar"
---

> **BulkActionBar**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/bulk-action-bar.tsx:33](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/bulk-action-bar.tsx#L33)

Toolbar that appears when rows are selected in a [DataTable](/api/ui/functions/datatable/).

Displays the selected row count, action buttons for each [BulkAction](/api/ui/type-aliases/bulkaction/),
and a "Clear" button to deselect all rows. Actions are rendered via the UI
plugin's `button` slot. Hidden automatically when `selectedCount` is zero.

## Parameters

### props

`BulkActionBarProps`

See BulkActionBarProps.

## Returns

`Element` \| `null`

## Example

```tsx
<BulkActionBar
  selectedCount={selectedRows.length}
  actions={[
    { label: "Delete", icon: TrashIcon },
    { label: "Publish" },
  ]}
  onAction={(action) => handleBulk(action, selectedRows)}
  onClearSelection={() => clearSelection()}
/>
```
