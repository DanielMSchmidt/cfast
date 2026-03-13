---
editUrl: false
next: false
prev: false
title: "introspectTable"
---

> **introspectTable**(`table`): [`FieldDefinition`](/api/forms/src/type-aliases/fielddefinition/)[]

Defined in: [packages/forms/src/introspect.ts:49](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/introspect.ts#L49)

Introspect a Drizzle SQLite table and produce field definitions for form generation.

## Parameters

### table

`SQLiteTable`

A Drizzle `SQLiteTable` to introspect.

## Returns

[`FieldDefinition`](/api/forms/src/type-aliases/fielddefinition/)[]

An array of [FieldDefinition](/api/forms/src/type-aliases/fielddefinition/) objects describing each column.

## Example

```ts
import { introspectTable } from "@cfast/forms";
import { posts } from "./schema";

const fields = introspectTable(posts);
// [{ name: "title", inputType: "text", label: "Title", required: true, ... }, ...]
```
