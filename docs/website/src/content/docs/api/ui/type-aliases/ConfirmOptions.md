---
editUrl: false
next: false
prev: false
title: "ConfirmOptions"
---

> **ConfirmOptions** = `object`

Defined in: [packages/ui/src/types.ts:913](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L913)

Options for the imperative confirmation dialog.

Passed to the function returned by `useConfirm()`, which resolves to `true`
(confirmed) or `false` (cancelled). Also accepted by [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/)
via the `confirmation` prop.

## See

[ConfirmDialogSlotProps](/api/ui/type-aliases/confirmdialogslotprops/) for the underlying dialog slot.

## Properties

### cancelLabel?

> `optional` **cancelLabel**: `string`

Defined in: [packages/ui/src/types.ts:921](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L921)

Label for the cancel button. Defaults to "Cancel".

***

### confirmLabel?

> `optional` **confirmLabel**: `string`

Defined in: [packages/ui/src/types.ts:919](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L919)

Label for the confirm button. Defaults to "Confirm".

***

### description?

> `optional` **description**: `string`

Defined in: [packages/ui/src/types.ts:917](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L917)

Optional description body.

***

### title

> **title**: `string`

Defined in: [packages/ui/src/types.ts:915](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L915)

Dialog title text.

***

### variant?

> `optional` **variant**: `"default"` \| `"danger"`

Defined in: [packages/ui/src/types.ts:923](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L923)

Visual variant; "danger" uses warning colors for destructive actions.
