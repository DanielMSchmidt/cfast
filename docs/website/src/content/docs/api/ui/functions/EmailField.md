---
editUrl: false
next: false
prev: false
title: "EmailField"
---

> **EmailField**(`props`): `Element`

Defined in: [packages/ui/src/fields/email-field.tsx:17](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/email-field.tsx#L17)

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
