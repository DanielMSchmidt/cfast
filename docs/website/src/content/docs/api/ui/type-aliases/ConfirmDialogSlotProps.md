---
editUrl: false
next: false
prev: false
title: "ConfirmDialogSlotProps"
---

> **ConfirmDialogSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L129)

Props for the confirm dialog plugin slot.

Rendered by [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/) when `confirmation` is set, and
available directly via the `useConfirm()` hook. Supports a "danger"
variant for destructive actions.

## See

 - [ConfirmOptions](/api/ui/type-aliases/confirmoptions/) for the imperative API options.
 - [UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### cancelLabel?

> `optional` **cancelLabel**: `string`

Defined in: [packages/ui/src/types.ts:143](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L143)

Label for the cancel button.

***

### confirmLabel?

> `optional` **confirmLabel**: `string`

Defined in: [packages/ui/src/types.ts:141](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L141)

Label for the confirm button.

***

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:139](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L139)

Optional description body.

***

### onClose()

> **onClose**: () => `void`

Defined in: [packages/ui/src/types.ts:133](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L133)

Called when the user cancels or closes the dialog.

#### Returns

`void`

***

### onConfirm()

> **onConfirm**: () => `void`

Defined in: [packages/ui/src/types.ts:135](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L135)

Called when the user confirms the action.

#### Returns

`void`

***

### open

> **open**: `boolean`

Defined in: [packages/ui/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L131)

Whether the dialog is currently visible.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:137](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L137)

Dialog title text.

***

### variant?

> `optional` **variant**: `"default"` \| `"danger"`

Defined in: [packages/ui/src/types.ts:145](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L145)

Visual variant; "danger" uses warning colors.
