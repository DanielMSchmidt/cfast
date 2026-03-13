---
editUrl: false
next: false
prev: false
title: "BreadcrumbItem"
---

> **BreadcrumbItem** = `object`

Defined in: [packages/ui/src/types.ts:960](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L960)

A single item in a breadcrumb trail.

The last item in the array typically omits `to` to represent the current page.
Used by [PageContainerSlotProps](/api/ui/type-aliases/pagecontainerslotprops/), [ListViewProps](/api/ui/type-aliases/listviewprops/), and
[DetailViewProps](/api/ui/type-aliases/detailviewprops/).

## See

[BreadcrumbSlotProps](/api/ui/type-aliases/breadcrumbslotprops/) for the breadcrumb rendering slot.

## Properties

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:962](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L962)

Display label for the breadcrumb segment.

***

### to?

> `optional` **to**: `string`

Defined in: [packages/ui/src/types.ts:964](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L964)

Route path; omit for the current (last) segment.
