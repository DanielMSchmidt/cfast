---
editUrl: false
next: false
prev: false
title: "UrlField"
---

> **UrlField**(`props`): `Element`

Defined in: [packages/ui/src/fields/url-field.tsx:19](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/fields/url-field.tsx#L19)

Read-only display component that renders a URL as an external link.

Opens in a new tab with `rel="noopener noreferrer"` and appends an arrow
indicator. When `truncate` is enabled, displays only the hostname and path
instead of the full URL. Returns an em-dash for null/undefined values.

## Parameters

### props

[`UrlFieldProps`](/api/ui/type-aliases/urlfieldprops/)

See [UrlFieldProps](/api/ui/type-aliases/urlfieldprops/).

## Returns

`Element`

An `<a>` element with `target="_blank"`, or a placeholder `<span>` for null values.

## Example

```tsx
<UrlField value="https://example.com/blog/post-1" truncate />
// -> "example.com/blog/post-1 (arrow icon)"
```
