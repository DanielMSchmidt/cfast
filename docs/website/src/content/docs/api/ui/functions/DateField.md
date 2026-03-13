---
editUrl: false
next: false
prev: false
title: "DateField"
---

> **DateField**(`props`): `Element`

Defined in: [packages/ui/src/fields/date-field.tsx:64](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/date-field.tsx#L64)

Read-only display component that formats date values.

Accepts `Date` objects, ISO strings, or Unix timestamps. Renders a `<time>`
element with the formatted date and a machine-readable `datetime` attribute.
Returns an em-dash for null/undefined values and "Invalid date" for unparseable input.

## Parameters

### props

[`DateFieldProps`](/api/ui/type-aliases/datefieldprops/)

See [DateFieldProps](/api/ui/type-aliases/datefieldprops/).

## Returns

`Element`

A `<time>` element with the formatted date, or a placeholder `<span>`.

## Example

```tsx
<DateField value={post.createdAt} format="relative" />
// -> "3 days ago"

<DateField value="2026-03-11" format="short" locale="en" />
// -> "Mar 11, 2026"
```
