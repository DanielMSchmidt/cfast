---
editUrl: false
next: false
prev: false
title: "EmailField"
---

> **EmailField**(`props`): `Element`

Defined in: [packages/ui/src/fields/email-field.tsx:17](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/fields/email-field.tsx#L17)

Read-only display component that renders an email address as a clickable `mailto:` link.

Returns an em-dash for null/undefined values.

## Parameters

### props

[`EmailFieldProps`](/api/ui/type-aliases/emailfieldprops/)

See [EmailFieldProps](/api/ui/type-aliases/emailfieldprops/).

## Returns

`Element`

An `<a>` element with a `mailto:` href, or a placeholder `<span>` for null values.

## Example

```tsx
<EmailField value={user.email} />
// -> <a href="mailto:user@example.com">user@example.com</a>
```
