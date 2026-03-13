---
editUrl: false
next: false
prev: false
title: "TextFieldProps"
---

> **TextFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:483](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L483)

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
