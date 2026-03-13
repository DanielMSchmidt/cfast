---
editUrl: false
next: false
prev: false
title: "BulkAction"
---

> **BulkAction** = `object`

Defined in: [packages/ui/src/types.ts:994](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L994)

Configuration for a bulk action available when rows are selected in a [DataTableProps](/api/ui/type-aliases/datatableprops/).

Each action can be backed by a `@cfast/actions` descriptor (permission-aware) or
a plain `handler` callback. The `confirmation` message supports a `{count}`
placeholder for the number of selected rows.

## See

[ListViewProps](/api/ui/type-aliases/listviewprops/) which accepts an array of bulk actions.

## Properties

### action?

> `optional` **action**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:998](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L998)

Action descriptor for permission checking.

***

### confirmation?

> `optional` **confirmation**: `string`

Defined in: [packages/ui/src/types.ts:1002](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1002)

Confirmation message; supports `{count}` placeholder.

***

### handler()?

> `optional` **handler**: (`rows`) => `void`

Defined in: [packages/ui/src/types.ts:1000](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1000)

Custom handler called with the selected rows.

#### Parameters

##### rows

`unknown`[]

#### Returns

`void`

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:1004](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1004)

Optional icon component for the action button.

***

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:996](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L996)

Display label for the action button.
