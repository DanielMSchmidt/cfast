---
editUrl: false
next: false
prev: false
title: "SidebarSlotProps"
---

> **SidebarSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:256](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L256)

Props for the sidebar plugin slot.

Renders navigation items inside the application shell. Items can be
permission-filtered via the [NavigationItem.action](/api/ui/type-aliases/navigationitem/#action) property.

## See

 - [NavigationItem](/api/ui/type-aliases/navigationitem/) for the shape of each navigation entry.
 - [AppShellSlotProps](/api/ui/type-aliases/appshellslotprops/) for the parent layout slot.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:258](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L258)

Sidebar content.

***

### items

> **items**: [`NavigationItem`](/api/ui/type-aliases/navigationitem/)[]

Defined in: [packages/ui/src/types.ts:260](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L260)

Navigation items to render in the sidebar.
