---
editUrl: false
next: false
prev: false
title: "EmptyStateProps"
---

> **EmptyStateProps** = `object`

Defined in: [packages/ui/src/types.ts:707](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L707)

Props for the EmptyState component.
Displays a permission-aware empty state with optional create CTA.

## Properties

### createAction?

> `optional` **createAction**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:713](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L713)

Action descriptor for the create button; controls CTA visibility.

***

### createLabel?

> `optional` **createLabel**: `string`

Defined in: [packages/ui/src/types.ts:715](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L715)

Label for the create button. Defaults to "Create".

***

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:711](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L711)

Description text with guidance.

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:717](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L717)

Optional icon component displayed above the title.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:709](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L709)

Title text (e.g. "No posts yet").
