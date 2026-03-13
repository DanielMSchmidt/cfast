---
editUrl: false
next: false
prev: false
title: "ImageFieldProps"
---

> **ImageFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:780](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L780)

Props for the ImageField read-only display component.

Renders an image thumbnail, resolving signed URLs from `@cfast/storage` when
a storage configuration is provided. Used by [DataTableProps](/api/ui/type-aliases/datatableprops/) cell
renderers for image columns.

## Type Declaration

### alt?

> `optional` **alt**: `string`

Alt text for the image element.

### height?

> `optional` **height**: `number`

Display height in pixels. Defaults to 60.

### storage?

> `optional` **storage**: `unknown`

Storage configuration for signed URL resolution.

### value

> **value**: `string` \| `null` \| `undefined`

Image URL or storage key.

### width?

> `optional` **width**: `number`

Display width in pixels. Defaults to 80.

## See

 - [ImagePreviewProps](/api/ui/type-aliases/imagepreviewprops/) for the standalone image preview component.
 - [BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
