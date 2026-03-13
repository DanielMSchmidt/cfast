---
editUrl: false
next: false
prev: false
title: "DashboardWidget"
---

> **DashboardWidget** = \{ `label`: `string`; `table`: `string`; `type`: `"count"`; `where?`: `Record`\<`string`, `unknown`\>; \} \| \{ `label`: `string`; `limit?`: `number`; `table`: `string`; `type`: `"recent"`; \}

Defined in: [packages/admin/src/types.ts:234](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L234)

A widget definition for the admin dashboard.

Widgets are rendered on the admin index page. The `"count"` type shows a
stat card with the total number of records. The `"recent"` type shows a
list of the most recent records from a table.

## Type Declaration

\{ `label`: `string`; `table`: `string`; `type`: `"count"`; `where?`: `Record`\<`string`, `unknown`\>; \}

### label

> **label**: `string`

Display label for the stat card.

### table

> **table**: `string`

The Drizzle table name to count records from.

### type

> **type**: `"count"`

Renders a count stat card for the given table.

### where?

> `optional` **where**: `Record`\<`string`, `unknown`\>

Optional filter conditions applied before counting.

\{ `label`: `string`; `limit?`: `number`; `table`: `string`; `type`: `"recent"`; \}

### label

> **label**: `string`

Display label for the recent items section.

### limit?

> `optional` **limit**: `number`

Maximum number of recent records to show. Defaults to `5`.

### table

> **table**: `string`

The Drizzle table name to fetch recent records from.

### type

> **type**: `"recent"`

Renders a list of recent records from the given table.

## Example

```typescript
const widgets: DashboardWidget[] = [
  { type: "count", table: "users", label: "Total Users" },
  { type: "count", table: "posts", label: "Published Posts", where: { published: true } },
  { type: "recent", table: "posts", label: "Recent Posts", limit: 5 },
];
```
