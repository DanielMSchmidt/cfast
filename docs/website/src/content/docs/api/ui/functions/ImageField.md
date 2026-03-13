---
editUrl: false
next: false
prev: false
title: "ImageField"
---

> **ImageField**(`props`): `Element`

Defined in: [packages/ui/src/fields/image-field.tsx:17](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/image-field.tsx#L17)

Read-only display component that renders an image thumbnail.

Displays the image at the specified dimensions with `object-fit: cover` and
rounded corners. Returns an em-dash for null/undefined values.

## Parameters

### props

[`ImageFieldProps`](/api/ui/type-aliases/imagefieldprops/)

See [ImageFieldProps](/api/ui/type-aliases/imagefieldprops/).

## Returns

`Element`

An `<img>` element, or a placeholder `<span>` for null values.

## Example

```tsx
<ImageField value={post.coverImageUrl} width={120} height={80} alt="Cover" />
```
