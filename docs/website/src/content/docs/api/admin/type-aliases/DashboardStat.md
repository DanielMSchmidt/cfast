---
editUrl: false
next: false
prev: false
title: "DashboardStat"
---

> **DashboardStat** = `object`

Defined in: [packages/admin/src/types.ts:376](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L376)

A single stat card displayed on the admin dashboard.

Produced by the admin loader when processing `"count"` type [dashboard widgets](/api/admin/type-aliases/dashboardwidget/).

## Properties

### label

> **label**: `string`

Defined in: [packages/admin/src/types.ts:378](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L378)

Display label for the stat card (e.g., `"Total Users"`).

***

### value

> **value**: `number`

Defined in: [packages/admin/src/types.ts:380](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L380)

The numeric count value.
