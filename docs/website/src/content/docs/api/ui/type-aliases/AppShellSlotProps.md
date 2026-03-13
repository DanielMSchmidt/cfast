---
editUrl: false
next: false
prev: false
title: "AppShellSlotProps"
---

> **AppShellSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:238](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L238)

Props for the application shell plugin slot.

The low-level slot rendered by [AppShellProps](/api/ui/type-aliases/appshellprops/). Provides the sidebar +
header + content layout structure. Use [AppShellProps](/api/ui/type-aliases/appshellprops/) in application code;
this type is for plugin implementors.

## See

[SidebarSlotProps](/api/ui/type-aliases/sidebarslotprops/) for the sidebar slot within the shell.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:240](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L240)

Main content area.

***

### header?

> `optional` **header**: `ReactNode`

Defined in: [packages/ui/src/types.ts:244](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L244)

Header element.

***

### sidebar?

> `optional` **sidebar**: `ReactNode`

Defined in: [packages/ui/src/types.ts:242](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L242)

Sidebar navigation element.
