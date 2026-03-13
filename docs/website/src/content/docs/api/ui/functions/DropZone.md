---
editUrl: false
next: false
prev: false
title: "DropZone"
---

> **DropZone**(`props`): `Element`

Defined in: [packages/ui/src/components/drop-zone.tsx:25](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/drop-zone.tsx#L25)

Drag-and-drop file upload area that integrates with `@cfast/storage`.

Accepts an `upload` result from `useUpload()` (`@cfast/storage/client`).
File type restrictions and max size are inherited from the storage schema.
Renders via the UI plugin's `dropZone` slot and manages drag state,
file validation, and upload progress internally.

## Parameters

### props

[`DropZoneProps`](/api/ui/type-aliases/dropzoneprops/)

See [DropZoneProps](/api/ui/type-aliases/dropzoneprops/).

## Returns

`Element`

## Example

```tsx
const upload = useUpload("postCoverImage");

<DropZone upload={upload} />

// Allow multiple files:
<DropZone upload={upload} multiple />
```
