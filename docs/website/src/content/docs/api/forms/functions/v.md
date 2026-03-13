---
editUrl: false
next: false
prev: false
title: "v"
---

> **v**\<`T`\>(`builder`, `rules`): `T`

Defined in: [packages/forms/src/validate.ts:37](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/validate.ts#L37)

Attach validation rules to a Drizzle column builder.

The rules are stored on the builder's internal config object via a Symbol,
which Drizzle passes through to the built Column instance. [introspectTable](/api/forms/functions/introspecttable/)
reads these rules back alongside schema-derived constraints (NOT NULL, text length)
to produce complete [FieldDefinition](/api/forms/type-aliases/fielddefinition/) objects.

## Type Parameters

### T

`T` *extends* `ColumnBuilderBase`\<`ColumnBuilderBaseConfig`\<`ColumnDataType`, `string`\>, `object`\>

The Drizzle column builder type, preserved for chaining.

## Parameters

### builder

`T`

A Drizzle column builder (e.g., `text("title").notNull()`).

### rules

[`ValidationRules`](/api/forms/type-aliases/validationrules/)

The [ValidationRules](/api/forms/type-aliases/validationrules/) to attach to the column.

## Returns

`T`

The same builder instance, so it can be used inline in a table definition.

## Example

```ts
import { v } from "@cfast/forms";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
  views: v(integer("views"), { min: 0 }),
  slug: v(text("slug").notNull(), { pattern: /^[a-z0-9-]+$/ }),
});
```
