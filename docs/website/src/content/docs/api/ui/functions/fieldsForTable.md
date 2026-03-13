---
editUrl: false
next: false
prev: false
title: "fieldsForTable"
---

> **fieldsForTable**(`table`): `Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`\>\>

Defined in: [packages/ui/src/fields/field-for-column.ts:99](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/field-for-column.ts#L99)

Given a Drizzle table, returns a map of column names to their inferred
TypedField components.

Iterates over the table's entries, identifies columns by duck-typing
(`dataType` and `name` properties), and delegates to [fieldForColumn](/api/ui/functions/fieldforcolumn/)
for each one.

## Parameters

### table

`object` & `Record`\<`string`, `unknown`\>

A Drizzle table object whose entries expose column metadata.

## Returns

`Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`\>\>

A record mapping column key names to field component types. Each
  component accepts [BaseFieldProps](/api/ui/type-aliases/basefieldprops/) and a `value` prop.

## Example

```ts
import { fieldsForTable } from "@cfast/ui";
import { posts } from "~/db/schema";

const fields = fieldsForTable(posts);
// fields.title === TextField
// fields.createdAt === DateField
// fields.published === BooleanField

const TitleField = fields.title;
<TitleField value={post.title} />;
```
