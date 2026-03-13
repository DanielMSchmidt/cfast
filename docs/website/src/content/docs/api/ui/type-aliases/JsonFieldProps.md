---
editUrl: false
next: false
prev: false
title: "JsonFieldProps"
---

> **JsonFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:839](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L839)

Props for the JsonField read-only display component.

Renders a JSON value as syntax-highlighted, formatted code with optional
collapse/expand functionality for large payloads.

## Type Declaration

### collapsed?

> `optional` **collapsed**: `boolean`

Whether to initially show a collapsed preview.

### value

> **value**: `unknown`

JSON value to display as formatted code.

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
