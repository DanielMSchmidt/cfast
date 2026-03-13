---
editUrl: false
next: false
prev: false
title: "ColumnDef"
---

> **ColumnDef**\<`T`\> = `object`

Defined in: [packages/ui/src/types.ts:386](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L386)

Full column definition for [DataTableProps](/api/ui/type-aliases/datatableprops/) and [DetailViewProps](/api/ui/type-aliases/detailviewprops/).

Specifies the column key, display label, sorting behavior, custom cell rendering,
and responsive priority. When a Drizzle table is provided, column metadata
(label, type-appropriate renderer) is inferred automatically; use `ColumnDef`
to override those defaults.

## See

[ColumnShorthand](/api/ui/type-aliases/columnshorthand/) for the shorthand form (plain string key).

## Type Parameters

### T

`T` = `unknown`

The row object type for type-safe `render` callbacks.

## Properties

### key

> **key**: `string`

Defined in: [packages/ui/src/types.ts:388](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L388)

Property key on the row object.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/ui/src/types.ts:390](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L390)

Human-readable column header label.

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/ui/src/types.ts:398](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L398)

Responsive priority; lower numbers stay visible on small screens.

***

### render()?

> `optional` **render**: (`value`, `row`) => `ReactNode`

Defined in: [packages/ui/src/types.ts:394](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L394)

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

Defined in: [packages/ui/src/types.ts:392](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L392)

Whether this column supports sorting. Defaults to true.

***

### width?

> `optional` **width**: `string` \| `number`

Defined in: [packages/ui/src/types.ts:396](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L396)

Fixed column width (CSS value or pixel number).
