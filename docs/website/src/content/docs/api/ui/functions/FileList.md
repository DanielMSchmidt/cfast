---
editUrl: false
next: false
prev: false
title: "FileList"
---

> **FileList**(`props`): `Element`

Defined in: [packages/ui/src/components/file-list.tsx:26](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/file-list.tsx#L26)

Displays a list of uploaded files with metadata, formatted sizes, and download links.

Each file is rendered as a row showing the file name, size (human-readable), and
a download link (either via `onDownload` callback or the file's direct `url`).
Returns a "No files" placeholder when the list is empty.

## Parameters

### props

[`FileListProps`](/api/ui/type-aliases/filelistprops/)

See [FileListProps](/api/ui/type-aliases/filelistprops/).

## Returns

`Element`

## Example

```tsx
<FileList
  files={post.attachments}
  onDownload={(file) => window.open(storage.getSignedUrl(file.key))}
/>
```
