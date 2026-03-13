---
editUrl: false
next: false
prev: false
title: "BulkAction"
---

> **BulkAction** = `object`

Defined in: [packages/ui/src/types.ts:634](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L634)

Configuration for a bulk action available when rows are selected.

## Properties

### action?

> `optional` **action**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:638](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L638)

Action descriptor for permission checking.

***

### confirmation?

> `optional` **confirmation**: `string`

Defined in: [packages/ui/src/types.ts:642](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L642)

Confirmation message; supports `{count}` placeholder.

***

### handler()?

> `optional` **handler**: (`rows`) => `void`

Defined in: [packages/ui/src/types.ts:640](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L640)

Custom handler called with the selected rows.

#### Parameters

##### rows

`unknown`[]

#### Returns

`void`

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:644](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L644)

Optional icon component for the action button.

***

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:636](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L636)

Display label for the action button.
