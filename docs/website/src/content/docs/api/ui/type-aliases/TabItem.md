---
editUrl: false
next: false
prev: false
title: "TabItem"
---

> **TabItem** = `object`

Defined in: [packages/ui/src/types.ts:974](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L974)

A tab item for sub-navigation within a page.

Used by [PageContainerSlotProps](/api/ui/type-aliases/pagecontainerslotprops/) to render tab navigation below the
page title. Either `to` (route-based) or `value` (programmatic) should be
provided.

## Properties

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:976](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L976)

Display label for the tab.

***

### to?

> `optional` **to**: `string`

Defined in: [packages/ui/src/types.ts:978](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L978)

Route path for the tab.

***

### value?

> `optional` **value**: `string`

Defined in: [packages/ui/src/types.ts:980](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L980)

Programmatic value identifier for the tab.
