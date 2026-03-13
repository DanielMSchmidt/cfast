---
editUrl: false
next: false
prev: false
title: "TableCellSlotProps"
---

> **TableCellSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:197](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L197)

Props for the table cell plugin slot.

Renders a single cell (`th` or `td`) inside a [TableRowSlotProps](/api/ui/type-aliases/tablerowslotprops/).
Supports sortable column headers with directional indicators.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:199](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L199)

Cell content.

***

### header?

> `optional` **header**: `boolean`

Defined in: [packages/ui/src/types.ts:201](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L201)

Whether this cell is a header cell (th vs td).

***

### onSort()?

> `optional` **onSort**: () => `void`

Defined in: [packages/ui/src/types.ts:207](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L207)

Handler called when the user clicks to sort by this column.

#### Returns

`void`

***

### sortable?

> `optional` **sortable**: `boolean`

Defined in: [packages/ui/src/types.ts:203](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L203)

Whether clicking this cell triggers sorting.

***

### sortDirection?

> `optional` **sortDirection**: `"asc"` \| `"desc"` \| `null`

Defined in: [packages/ui/src/types.ts:205](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L205)

Current sort direction for this column, or null if not sorted.
