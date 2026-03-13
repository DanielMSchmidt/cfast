---
editUrl: false
next: false
prev: false
title: "DropZoneSlotProps"
---

> **DropZoneSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:216](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L216)

Props for the drop zone plugin slot.

## Properties

### accept?

> `optional` **accept**: `string`

Defined in: [packages/ui/src/types.ts:232](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L232)

MIME type filter for accepted files.

***

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:218](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L218)

Drop zone content (instructions or file preview).

***

### isDragOver

> **isDragOver**: `boolean`

Defined in: [packages/ui/src/types.ts:220](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L220)

Whether a file is currently being dragged over the zone.

***

### isInvalid

> **isInvalid**: `boolean`

Defined in: [packages/ui/src/types.ts:222](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L222)

Whether the dragged file is invalid (wrong type).

***

### onClick()

> **onClick**: () => `void`

Defined in: [packages/ui/src/types.ts:230](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L230)

Handler called when the zone is clicked (opens file picker).

#### Returns

`void`

***

### onDragLeave()

> **onDragLeave**: () => `void`

Defined in: [packages/ui/src/types.ts:228](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L228)

Handler called when the drag leaves the zone.

#### Returns

`void`

***

### onDragOver()

> **onDragOver**: (`e`) => `void`

Defined in: [packages/ui/src/types.ts:226](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L226)

Handler called during dragover for visual feedback.

#### Parameters

##### e

`React.DragEvent`

#### Returns

`void`

***

### onDrop()

> **onDrop**: (`files`) => `void`

Defined in: [packages/ui/src/types.ts:224](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L224)

Handler called when files are dropped.

#### Parameters

##### files

`FileList`

#### Returns

`void`
