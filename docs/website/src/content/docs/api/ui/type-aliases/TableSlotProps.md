---
editUrl: false
next: false
prev: false
title: "TableSlotProps"
---

> **TableSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:156](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L156)

Props for the table plugin slot.

The root table element rendered by [DataTableProps](/api/ui/type-aliases/datatableprops/). Wraps
[TableSectionSlotProps](/api/ui/type-aliases/tablesectionslotprops/) (head/body) and [TableRowSlotProps](/api/ui/type-aliases/tablerowslotprops/) children.

## See

[UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:158](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L158)

Table rows and sections.

***

### hoverRow?

> `optional` **hoverRow**: `boolean`

Defined in: [packages/ui/src/types.ts:160](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L160)

Whether to highlight rows on hover.
