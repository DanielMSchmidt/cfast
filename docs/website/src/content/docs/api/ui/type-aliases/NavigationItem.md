---
editUrl: false
next: false
prev: false
title: "NavigationItem"
---

> **NavigationItem** = `object`

Defined in: [packages/ui/src/types.ts:938](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L938)

A navigation item for sidebar or menu rendering.

Items can be permission-filtered: when `action` is provided, the item is
automatically hidden if the current user lacks permission for that action.
Supports nested children for sub-menu hierarchies.

## See

 - [SidebarSlotProps](/api/ui/type-aliases/sidebarslotprops/) which renders an array of these items.
 - [BreadcrumbItem](/api/ui/type-aliases/breadcrumbitem/) for the breadcrumb-specific navigation type.

## Properties

### action?

> `optional` **action**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:946](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L946)

If provided, the item is hidden when the user lacks permission for this action.

***

### children?

> `optional` **children**: `NavigationItem`[]

Defined in: [packages/ui/src/types.ts:948](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L948)

Nested navigation items for sub-menus.

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:944](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L944)

Optional icon component rendered before the label.

***

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:940](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L940)

Display label for the navigation link.

***

### to

> **to**: `string`

Defined in: [packages/ui/src/types.ts:942](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L942)

Route path to navigate to.
