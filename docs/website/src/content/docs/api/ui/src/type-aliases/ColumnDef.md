---
editUrl: false
next: false
prev: false
title: "ColumnDef"
---

> **ColumnDef**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:251](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L251)

Full column definition for DataTable and DetailView.
Specifies the column key, display label, sorting, and custom rendering.

## Type Parameters

### T

`T` = `unknown`

## Properties

### key

> **key**: `string`

Defined in: [packages/ui/src/types.ts:253](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L253)

Property key on the row object.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/ui/src/types.ts:255](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L255)

Human-readable column header label.

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/ui/src/types.ts:263](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L263)

Responsive priority; lower numbers stay visible on small screens.

***

### render()?

> `optional` **render**: (`value`, `row`) => `ReactNode`

Defined in: [packages/ui/src/types.ts:259](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L259)

Custom render function for the cell value.

#### Parameters

##### value

`unknown`

##### row

`T`

#### Returns

`ReactNode`

***

### sortable?

> `optional` **sortable**: `boolean`

Defined in: [packages/ui/src/types.ts:257](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L257)

Whether this column supports sorting. Defaults to true.

***

### width?

> `optional` **width**: `string` \| `number`

Defined in: [packages/ui/src/types.ts:261](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L261)

Fixed column width (CSS value or pixel number).
