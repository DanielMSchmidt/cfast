---
editUrl: false
next: false
prev: false
title: "PageContainerSlotProps"
---

> **PageContainerSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:273](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L273)

Props for the page container plugin slot.

Provides the page wrapper with title, breadcrumb trail, action buttons, and
optional tab navigation. Used internally by [ListViewProps](/api/ui/type-aliases/listviewprops/) and
[DetailViewProps](/api/ui/type-aliases/detailviewprops/).

## See

 - [BreadcrumbItem](/api/ui/type-aliases/breadcrumbitem/) for breadcrumb trail entries.
 - [TabItem](/api/ui/type-aliases/tabitem/) for sub-navigation tabs.

## Properties

### actions?

> `optional` **actions**: `ReactNode`

Defined in: [packages/ui/src/types.ts:281](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L281)

Action buttons rendered in the page header.

***

### breadcrumb?

> `optional` **breadcrumb**: [`BreadcrumbItem`](/api/ui/type-aliases/breadcrumbitem/)[]

Defined in: [packages/ui/src/types.ts:279](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L279)

Breadcrumb trail items.

***

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:275](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L275)

Page body content.

***

### tabs?

> `optional` **tabs**: [`TabItem`](/api/ui/type-aliases/tabitem/)[]

Defined in: [packages/ui/src/types.ts:283](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L283)

Tab items for sub-navigation within the page.

***

### title?

> `optional` **title**: `string`

Defined in: [packages/ui/src/types.ts:277](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L277)

Page title displayed in the header area.
