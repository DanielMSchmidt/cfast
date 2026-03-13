---
editUrl: false
next: false
prev: false
title: "RelationField"
---

> **RelationField**(`props`): `Element`

Defined in: [packages/ui/src/fields/relation-field.tsx:21](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/fields/relation-field.tsx#L21)

Read-only display component for related record references.

Extracts the display property (defaults to `"name"`) from the related record
object and renders it as plain text or a link. When `linkTo` is provided,
the `:id` placeholder is replaced with the record's `id` to form the href.
Returns an em-dash for null/undefined values.

## Parameters

### props

[`RelationFieldProps`](/api/ui/type-aliases/relationfieldprops/)

See [RelationFieldProps](/api/ui/type-aliases/relationfieldprops/).

## Returns

`Element`

An `<a>` element if `linkTo` is set and the record has an `id`,
  a plain `<span>` otherwise, or a placeholder for null values.

## Example

```tsx
<RelationField value={post.author} display="name" linkTo="/users/:id" />
// -> <a href="/users/abc123">Jane Doe</a>
```
