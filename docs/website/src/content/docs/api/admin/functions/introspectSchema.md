---
editUrl: false
next: false
prev: false
title: "introspectSchema"
---

> **introspectSchema**(`schema`, `tableOverrides?`): [`AdminTableMeta`](/api/admin/type-aliases/admintablemeta/)[]

Defined in: [packages/admin/src/introspect.ts:127](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/introspect.ts#L127)

Introspect a Drizzle schema and produce [AdminTableMeta](/api/admin/type-aliases/admintablemeta/) for each visible table.

Reads every `SQLiteTable` in the schema, extracts column types, foreign keys,
and primary keys, then applies user-provided [TableOverrides](/api/admin/type-aliases/tableoverrides/). Auth-internal
tables (`session`, `account`, `verification`, `passkey`) are auto-excluded unless
you explicitly provide overrides for them.

Use this directly when you need server/client code splitting (the result is
JSON-serializable minus the `drizzleTable` references, which stay on the server).

## Parameters

### schema

`Record`\<`string`, `SQLiteTable`\>

Your Drizzle schema object (e.g., `import * as schema from "~/schema"`).

### tableOverrides?

`Record`\<`string`, [`TableOverrides`](/api/admin/type-aliases/tableoverrides/)\>

Optional per-table display and behavior overrides, keyed by table name.

## Returns

[`AdminTableMeta`](/api/admin/type-aliases/admintablemeta/)[]

An array of [AdminTableMeta](/api/admin/type-aliases/admintablemeta/) sorted alphabetically by table name.

## Example

```typescript
import { introspectSchema } from "@cfast/admin";
import * as schema from "~/schema";

const tableMetas = introspectSchema(schema, {
  posts: { label: "Blog Posts", listColumns: ["title", "createdAt"] },
});
```
