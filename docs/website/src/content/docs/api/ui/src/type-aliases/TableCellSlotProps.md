---
editUrl: false
next: false
prev: false
title: "TableCellSlotProps"
---

> **TableCellSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:136](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L136)

Props for the table cell plugin slot.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:138](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L138)

Cell content.

***

### header?

> `optional` **header**: `boolean`

Defined in: [packages/ui/src/types.ts:140](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L140)

Whether this cell is a header cell (th vs td).

***

### onSort()?

> `optional` **onSort**: () => `void`

Defined in: [packages/ui/src/types.ts:146](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L146)

Handler called when the user clicks to sort by this column.

#### Returns

`void`

***

### sortable?

> `optional` **sortable**: `boolean`

Defined in: [packages/ui/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L142)

Whether clicking this cell triggers sorting.

***

### sortDirection?

> `optional` **sortDirection**: `"asc"` \| `"desc"` \| `null`

Defined in: [packages/ui/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L144)

Current sort direction for this column, or null if not sorted.
