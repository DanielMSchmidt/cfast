---
editUrl: false
next: false
prev: false
title: "ConfirmDialogSlotProps"
---

> **ConfirmDialogSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:92](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L92)

Props for the confirm dialog plugin slot.

## Properties

### cancelLabel?

> `optional` **cancelLabel**: `string`

Defined in: [packages/ui/src/types.ts:106](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L106)

Label for the cancel button.

***

### confirmLabel?

> `optional` **confirmLabel**: `string`

Defined in: [packages/ui/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L104)

Label for the confirm button.

***

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L102)

Optional description body.

***

### onClose()

> **onClose**: () => `void`

Defined in: [packages/ui/src/types.ts:96](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L96)

Called when the user cancels or closes the dialog.

#### Returns

`void`

***

### onConfirm()

> **onConfirm**: () => `void`

Defined in: [packages/ui/src/types.ts:98](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L98)

Called when the user confirms the action.

#### Returns

`void`

***

### open

> **open**: `boolean`

Defined in: [packages/ui/src/types.ts:94](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L94)

Whether the dialog is currently visible.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L100)

Dialog title text.

***

### variant?

> `optional` **variant**: `"default"` \| `"danger"`

Defined in: [packages/ui/src/types.ts:108](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L108)

Visual variant; "danger" uses warning colors.
