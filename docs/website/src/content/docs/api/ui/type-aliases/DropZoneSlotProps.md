---
editUrl: false
next: false
prev: false
title: "DropZoneSlotProps"
---

> **DropZoneSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:339](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L339)

Props for the drop zone plugin slot.

The low-level slot for drag-and-drop file upload areas. Handles drag state
feedback, file validation, and click-to-browse. Use [DropZoneProps](/api/ui/type-aliases/dropzoneprops/) in
application code; this type is for plugin implementors.

## See

 - [DropZoneProps](/api/ui/type-aliases/dropzoneprops/) for the high-level component props.
 - [UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### accept?

> `optional` **accept**: `string`

Defined in: [packages/ui/src/types.ts:355](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L355)

MIME type filter for accepted files.

***

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:341](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L341)

Drop zone content (instructions or file preview).

***

### isDragOver

> **isDragOver**: `boolean`

Defined in: [packages/ui/src/types.ts:343](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L343)

Whether a file is currently being dragged over the zone.

***

### isInvalid

> **isInvalid**: `boolean`

Defined in: [packages/ui/src/types.ts:345](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L345)

Whether the dragged file is invalid (wrong type).

***

### onClick()

> **onClick**: () => `void`

Defined in: [packages/ui/src/types.ts:353](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L353)

Handler called when the zone is clicked (opens file picker).

#### Returns

`void`

***

### onDragLeave()

> **onDragLeave**: () => `void`

Defined in: [packages/ui/src/types.ts:351](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L351)

Handler called when the drag leaves the zone.

#### Returns

`void`

***

### onDragOver()

> **onDragOver**: (`e`) => `void`

Defined in: [packages/ui/src/types.ts:349](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L349)

Handler called during dragover for visual feedback.

#### Parameters

##### e

`React.DragEvent`

#### Returns

`void`

***

### onDrop()

> **onDrop**: (`files`) => `void`

Defined in: [packages/ui/src/types.ts:347](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L347)

Handler called when files are dropped.

#### Parameters

##### files

`FileList`

#### Returns

`void`
