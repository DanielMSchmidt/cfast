---
editUrl: false
next: false
prev: false
title: "BooleanField"
---

> **BooleanField**(`props`): `Element`

Defined in: [packages/ui/src/fields/boolean-field.tsx:20](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/fields/boolean-field.tsx#L20)

Read-only display component that renders a boolean value as a colored chip.

Uses the plugin's `chip` slot (via [useComponent](/api/ui/functions/usecomponent/)) for styling.
Displays customizable labels and colors for `true` and `false` states.
Returns an em-dash for null/undefined values.

## Parameters

### props

[`BooleanFieldProps`](/api/ui/type-aliases/booleanfieldprops/)

See [BooleanFieldProps](/api/ui/type-aliases/booleanfieldprops/).

## Returns

`Element`

A styled chip element, or a placeholder `<span>` for null values.

## Example

```tsx
<BooleanField value={post.published} trueLabel="Published" falseLabel="Draft" />
// -> Green chip: "Published" or neutral chip: "Draft"
```
