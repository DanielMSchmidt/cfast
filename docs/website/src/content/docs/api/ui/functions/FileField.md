---
editUrl: false
next: false
prev: false
title: "FileField"
---

> **FileField**(`props`): `Element`

Defined in: [packages/ui/src/fields/file-field.tsx:25](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/file-field.tsx#L25)

Read-only display component that renders a file reference with an icon,
display name, and optional formatted file size.

Uses `fileName` if provided, otherwise falls back to the raw `value` string.
File sizes are formatted as B/KB/MB. Returns an em-dash for null/undefined values.

## Parameters

### props

[`FileFieldProps`](/api/ui/type-aliases/filefieldprops/)

See [FileFieldProps](/api/ui/type-aliases/filefieldprops/).

## Returns

`Element`

A `<span>` with a file icon, name, and size, or a placeholder for null values.

## Example

```tsx
<FileField value="report.pdf" fileName="Q4 Report.pdf" fileSize={2048576} />
// -> "Q4 Report.pdf (2.0 MB)"
```
