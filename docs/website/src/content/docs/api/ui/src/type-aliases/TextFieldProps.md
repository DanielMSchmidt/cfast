---
editUrl: false
next: false
prev: false
title: "TextFieldProps"
---

> **TextFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:483](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L483)

Props for the TextField read-only display component.

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
