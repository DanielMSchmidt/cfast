---
editUrl: false
next: false
prev: false
title: "RowAction"
---

> **RowAction** = `object`

Defined in: [packages/admin/src/types.ts:130](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L130)

A custom action that appears on each row in a table's list view.

Row actions are invoked with the record's primary key and the form data
from the admin action handler.

## Example

```typescript
const publishAction: RowAction = {
  label: "Publish",
  action: async (id, formData) => {
    await db.update(posts).set({ published: true }).where(eq(posts.id, id));
  },
  confirm: "Are you sure you want to publish this post?",
  variant: "default",
};
```

## Properties

### action()

> **action**: (`id`, `formData`) => `Promise`\<`unknown`\>

Defined in: [packages/admin/src/types.ts:134](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L134)

Async handler called with the record ID and the submitted form data.

#### Parameters

##### id

`string`

##### formData

`FormData`

#### Returns

`Promise`\<`unknown`\>

***

### confirm?

> `optional` **confirm**: `string`

Defined in: [packages/admin/src/types.ts:136](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L136)

Optional confirmation message. When set, the admin shows a confirm dialog before executing.

***

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:132](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L132)

Display label for the action button.

***

### variant?

> `optional` **variant**: `"danger"` \| `"default"`

Defined in: [packages/admin/src/types.ts:138](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L138)

Button styling variant. `"danger"` renders a destructive-style button. Defaults to `"default"`.
