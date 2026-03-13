---
editUrl: false
next: false
prev: false
title: "TextField"
---

> **TextField**(`props`): `Element`

Defined in: [packages/ui/src/fields/text-field.tsx:19](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/fields/text-field.tsx#L19)

Read-only display component for plain text values.

Optionally truncates long strings at `maxLength` characters with an ellipsis
and shows the full text in a `title` tooltip on hover. Returns an em-dash
for null/undefined values.

## Parameters

### props

[`TextFieldProps`](/api/ui/type-aliases/textfieldprops/)

See [TextFieldProps](/api/ui/type-aliases/textfieldprops/).

## Returns

`Element`

A `<span>` with the text content, or a placeholder for null values.

## Example

```tsx
<TextField value={post.title} maxLength={50} />
// -> Truncated with tooltip if longer than 50 characters
```
