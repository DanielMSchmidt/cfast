---
editUrl: false
next: false
prev: false
title: "TableRowSlotProps"
---

> **TableRowSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:182](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L182)

Props for the table row plugin slot.

Renders a single row inside a [TableSectionSlotProps](/api/ui/type-aliases/tablesectionslotprops/). Supports
selection highlighting and click handling for row navigation.

## See

[TableCellSlotProps](/api/ui/type-aliases/tablecellslotprops/) for the cell-level props within each row.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:184](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L184)

Table cells within this row.

***

### onClick()?

> `optional` **onClick**: () => `void`

Defined in: [packages/ui/src/types.ts:188](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L188)

Click handler for the row.

#### Returns

`void`

***

### selected?

> `optional` **selected**: `boolean`

Defined in: [packages/ui/src/types.ts:186](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L186)

Whether this row is currently selected.
