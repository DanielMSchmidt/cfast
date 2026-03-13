---
editUrl: false
next: false
prev: false
title: "ImagePreviewProps"
---

> **ImagePreviewProps** = `object`

Defined in: [packages/ui/src/types.ts:785](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L785)

Props for the ImagePreview component.

## Properties

### alt?

> `optional` **alt**: `string`

Defined in: [packages/ui/src/types.ts:801](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L801)

Alt text for the image.

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [packages/ui/src/types.ts:799](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L799)

Fallback element when no image is available.

***

### fileKey?

> `optional` **fileKey**: `string` \| `null`

Defined in: [packages/ui/src/types.ts:787](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L787)

Storage file key for signed URL resolution.

***

### getUrl()?

> `optional` **getUrl**: (`key`) => `string`

Defined in: [packages/ui/src/types.ts:793](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L793)

Function to resolve a file key to a URL.

#### Parameters

##### key

`string`

#### Returns

`string`

***

### height?

> `optional` **height**: `number`

Defined in: [packages/ui/src/types.ts:797](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L797)

Display height in pixels. Defaults to 200.

***

### src?

> `optional` **src**: `string` \| `null`

Defined in: [packages/ui/src/types.ts:789](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L789)

Direct image source URL.

***

### storage?

> `optional` **storage**: `unknown`

Defined in: [packages/ui/src/types.ts:791](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L791)

Storage configuration for URL resolution.

***

### width?

> `optional` **width**: `number`

Defined in: [packages/ui/src/types.ts:795](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L795)

Display width in pixels. Defaults to 200.
