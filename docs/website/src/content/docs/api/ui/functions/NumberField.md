---
editUrl: false
next: false
prev: false
title: "NumberField"
---

> **NumberField**(`props`): `Element`

Defined in: [packages/ui/src/fields/number-field.tsx:21](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/fields/number-field.tsx#L21)

Read-only display component that formats numeric values.

Uses `Intl.NumberFormat` for locale-aware formatting. Supports currency
display and decimal precision control. Returns an em-dash for null/undefined values.

## Parameters

### props

[`NumberFieldProps`](/api/ui/type-aliases/numberfieldprops/)

See [NumberFieldProps](/api/ui/type-aliases/numberfieldprops/).

## Returns

`Element`

A `<span>` with the formatted number, or a placeholder for null values.

## Example

```tsx
<NumberField value={1234.5} locale="en" />
// -> "1,234.5"

<NumberField value={29.99} currency="USD" />
// -> "$29.99"
```
