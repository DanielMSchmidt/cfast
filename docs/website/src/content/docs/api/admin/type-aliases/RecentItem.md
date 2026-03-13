---
editUrl: false
next: false
prev: false
title: "RecentItem"
---

> **RecentItem** = `object`

Defined in: [packages/admin/src/types.ts:388](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L388)

A recent-items section displayed on the admin dashboard.

Produced by the admin loader when processing `"recent"` type [dashboard widgets](/api/admin/type-aliases/dashboardwidget/).

## Properties

### columns

> **columns**: `string`[]

Defined in: [packages/admin/src/types.ts:396](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L396)

Column names to display for each item in the list.

***

### items

> **items**: `Record`\<`string`, `unknown`\>[]

Defined in: [packages/admin/src/types.ts:394](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L394)

The fetched records, as plain key-value objects.

***

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:392](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L392)

Display label for the section heading (e.g., `"Recent Posts"`).

***

### table

> **table**: `string`

Defined in: [packages/admin/src/types.ts:390](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L390)

The table name these items belong to. Used for linking to detail views.
