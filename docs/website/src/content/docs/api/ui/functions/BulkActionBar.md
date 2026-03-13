---
editUrl: false
next: false
prev: false
title: "BulkActionBar"
---

> **BulkActionBar**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/bulk-action-bar.tsx:33](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/bulk-action-bar.tsx#L33)

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
