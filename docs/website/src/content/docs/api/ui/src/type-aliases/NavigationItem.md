---
editUrl: false
next: false
prev: false
title: "NavigationItem"
---

> **NavigationItem** = `object`

Defined in: [packages/ui/src/types.ts:600](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L600)

A navigation item for sidebar or menu rendering.

## Properties

### action?

> `optional` **action**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:608](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L608)

If provided, the item is hidden when the user lacks permission for this action.

***

### children?

> `optional` **children**: `NavigationItem`[]

Defined in: [packages/ui/src/types.ts:610](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L610)

Nested navigation items for sub-menus.

***

### icon?

> `optional` **icon**: `ComponentType`\<\{ `className?`: `string`; \}\>

Defined in: [packages/ui/src/types.ts:606](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L606)

Optional icon component rendered before the label.

***

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:602](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L602)

Display label for the navigation link.

***

### to

> **to**: `string`

Defined in: [packages/ui/src/types.ts:604](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L604)

Route path to navigate to.
