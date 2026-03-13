---
editUrl: false
next: false
prev: false
title: "ImagePreviewProps"
---

> **ImagePreviewProps** = `object`

Defined in: [packages/ui/src/types.ts:1226](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1226)

Props for the ImagePreview component.

Displays an image from `@cfast/storage` with signed URL handling. Supports
both direct `src` URLs and storage `fileKey` resolution. Shows a fallback
element when no image is available.

## See

 - [ImageFieldProps](/api/ui/type-aliases/imagefieldprops/) for the inline field variant used in tables.
 - [DropZoneProps](/api/ui/type-aliases/dropzoneprops/) for uploading new images.

## Properties

### alt?

> `optional` **alt**: `string`

Defined in: [packages/ui/src/types.ts:1242](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1242)

Alt text for the image.

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1240](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1240)

Fallback element when no image is available.

***

### fileKey?

> `optional` **fileKey**: `string` \| `null`

Defined in: [packages/ui/src/types.ts:1228](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1228)

Storage file key for signed URL resolution.

***

### getUrl()?

> `optional` **getUrl**: (`key`) => `string`

Defined in: [packages/ui/src/types.ts:1234](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1234)

Function to resolve a file key to a URL.

#### Parameters

##### key

`string`

#### Returns

`string`

***

### height?

> `optional` **height**: `number`

Defined in: [packages/ui/src/types.ts:1238](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1238)

Display height in pixels. Defaults to 200.

***

### src?

> `optional` **src**: `string` \| `null`

Defined in: [packages/ui/src/types.ts:1230](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1230)

Direct image source URL.

***

### storage?

> `optional` **storage**: `unknown`

Defined in: [packages/ui/src/types.ts:1232](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1232)

Storage configuration for URL resolution.

***

### width?

> `optional` **width**: `number`

Defined in: [packages/ui/src/types.ts:1236](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1236)

Display width in pixels. Defaults to 200.
