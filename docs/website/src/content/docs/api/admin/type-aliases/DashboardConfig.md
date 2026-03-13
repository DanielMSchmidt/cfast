---
editUrl: false
next: false
prev: false
title: "DashboardConfig"
---

> **DashboardConfig** = `object`

Defined in: [packages/admin/src/types.ts:272](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L272)

Configuration for the admin dashboard (the admin index page).

When no widgets are configured, the dashboard shows a count for every
visible table and recent items from the first table.

## Example

```typescript
const dashboard: DashboardConfig = {
  widgets: [
    { type: "count", table: "users", label: "Total Users" },
    { type: "recent", table: "posts", label: "Recent Posts", limit: 10 },
  ],
};
```

## Properties

### widgets?

> `optional` **widgets**: [`DashboardWidget`](/api/admin/type-aliases/dashboardwidget/)[]

Defined in: [packages/admin/src/types.ts:274](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L274)

Dashboard widget definitions. When omitted, the admin auto-generates widgets from the schema.
