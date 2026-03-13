---
editUrl: false
next: false
prev: false
title: "TextFieldProps"
---

> **TextFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:734](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L734)

Props for the TextField read-only display component.

Displays plain text with optional truncation (tooltip on overflow) and
copy-to-clipboard functionality. Used by [DataTableProps](/api/ui/type-aliases/datatableprops/) cell renderers
for text/varchar columns.

## Type Declaration

### copyable?

> `optional` **copyable**: `boolean`

Whether to show a copy-to-clipboard button.

### maxLength?

> `optional` **maxLength**: `number`

Maximum display length; longer values are truncated with a tooltip.

### value

> **value**: `string` \| `null` \| `undefined`

Text value to display.

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
