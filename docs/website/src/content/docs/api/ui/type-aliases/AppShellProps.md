---
editUrl: false
next: false
prev: false
title: "AppShellProps"
---

> **AppShellProps** = `object`

Defined in: [packages/ui/src/types.ts:1131](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1131)

Props for the AppShell layout component.

Base layout with sidebar navigation, header, and content area. Typically
used in the root layout route to wrap all pages. Delegates to the
[AppShellSlotProps](/api/ui/type-aliases/appshellslotprops/) plugin slot for rendering.

## See

 - [SidebarSlotProps](/api/ui/type-aliases/sidebarslotprops/) for sidebar rendering.
 - [NavigationItem](/api/ui/type-aliases/navigationitem/) for sidebar navigation entries.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1133](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1133)

Main content area.

***

### header?

> `optional` **header**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1137](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1137)

Header element.

***

### sidebar?

> `optional` **sidebar**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1135](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1135)

Sidebar navigation element.
