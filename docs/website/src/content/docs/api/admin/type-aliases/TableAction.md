---
editUrl: false
next: false
prev: false
title: "TableAction"
---

> **TableAction** = `object`

Defined in: [packages/admin/src/types.ts:156](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L156)

A bulk action that operates on multiple selected rows in a table's list view.

Table actions appear in the bulk action bar when one or more rows are selected.

## Example

```typescript
const exportAction: TableAction = {
  label: "Export CSV",
  handler: async (selectedIds) => {
    await exportToCsv(selectedIds);
  },
};
```

## Properties

### handler()

> **handler**: (`selectedIds`) => `Promise`\<`unknown`\>

Defined in: [packages/admin/src/types.ts:160](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L160)

Async handler called with the array of selected record IDs.

#### Parameters

##### selectedIds

`string`[]

#### Returns

`Promise`\<`unknown`\>

***

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:158](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L158)

Display label for the bulk action button.
