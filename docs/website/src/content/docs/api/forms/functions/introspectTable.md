---
editUrl: false
next: false
prev: false
title: "introspectTable"
---

> **introspectTable**(`table`): [`FieldDefinition`](/api/forms/type-aliases/fielddefinition/)[]

Defined in: [packages/forms/src/introspect.ts:54](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/introspect.ts#L54)

Introspect a Drizzle SQLite table and produce field definitions for form generation.

Reads column metadata (type, nullability, defaults, enums) and merges it with any
[ValidationRules](/api/forms/type-aliases/validationrules/) attached via the [v](/api/forms/functions/v/) helper. The resulting
[FieldDefinition](/api/forms/type-aliases/fielddefinition/) array is used by [createResolver](/api/forms/functions/createresolver/) for validation
and by the AutoForm component for rendering.

## Parameters

### table

`SQLiteTable`

A Drizzle `SQLiteTable` to introspect.

## Returns

[`FieldDefinition`](/api/forms/type-aliases/fielddefinition/)[]

An array of [FieldDefinition](/api/forms/type-aliases/fielddefinition/) objects, one per column in the table.

## Example

```ts
import { introspectTable } from "@cfast/forms";
import { posts } from "./schema";

const fields = introspectTable(posts);
// [{ name: "title", inputType: "text", label: "Title", required: true, ... }, ...]
```
