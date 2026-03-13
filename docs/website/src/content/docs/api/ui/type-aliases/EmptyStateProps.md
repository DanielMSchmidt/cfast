---
editUrl: false
next: false
prev: false
title: "EmptyStateProps"
---

> **EmptyStateProps** = `object`

Defined in: [packages/ui/src/types.ts:1106](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1106)

Props for the EmptyState component.

Displays a permission-aware empty state with optional create CTA. Behavior adapts
based on `createAction` permission status:

- If permitted, the create button is shown.
- If forbidden, only the title and description are shown.
- If invisible (no relation), a generic "Nothing here" message is shown.

## See

[ListViewProps](/api/ui/type-aliases/listviewprops/) which uses EmptyState automatically when data is empty.

## Properties

### createAction?

> `optional` **createAction**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:1112](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1112)

Action descriptor for the create button; controls CTA visibility.

***

### createLabel?

> `optional` **createLabel**: `string`

Defined in: [packages/ui/src/types.ts:1114](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1114)

Label for the create button. Defaults to "Create".

***

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:1110](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1110)

Description text with guidance.

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:1116](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1116)

Optional icon component displayed above the title.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:1108](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1108)

Title text (e.g. "No posts yet").
