---
editUrl: false
next: false
prev: false
title: "FilterOption"
---

> **FilterOption** = `object`

Defined in: [packages/ui/src/types.ts:456](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L456)

A single option for `"select"` and `"multiSelect"` [FilterType](/api/ui/type-aliases/filtertype/) filters.

The `value` is serialized to URL search params; the `label` is displayed in the UI.

## See

[FilterDef](/api/ui/type-aliases/filterdef/) which holds an array of these options.

## Properties

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:458](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L458)

Display label for the option.

***

### value

> **value**: `string` \| `number` \| `boolean`

Defined in: [packages/ui/src/types.ts:460](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L460)

Serialized value for URL params.
