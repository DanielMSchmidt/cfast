---
editUrl: false
next: false
prev: false
title: "ImagePreview"
---

> **ImagePreview**(`props`): `Element`

Defined in: [packages/ui/src/components/image-preview.tsx:23](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/image-preview.tsx#L23)

Displays an image from `@cfast/storage` or a direct URL.

Resolves the display URL from either a direct `src`, or a `fileKey` + `getUrl`
resolver function (for signed URL generation). Shows a placeholder when no
image is available, or renders the `fallback` element if provided.

## Parameters

### props

[`ImagePreviewProps`](/api/ui/type-aliases/imagepreviewprops/)

See [ImagePreviewProps](/api/ui/type-aliases/imagepreviewprops/).

## Returns

`Element`

## Example

```tsx
<ImagePreview
  fileKey={post.coverImageKey}
  getUrl={(key) => storage.getSignedUrl(key)}
  width={200}
  height={150}
  fallback={<PlaceholderImage />}
/>
```
