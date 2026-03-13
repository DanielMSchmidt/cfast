---
editUrl: false
next: false
prev: false
title: "createResolver"
---

> **createResolver**(`fields`, `fieldOverrides?`): `Resolver`\<`FieldValues`\>

Defined in: [packages/forms/src/resolver.ts:81](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/resolver.ts#L81)

Create a react-hook-form resolver that validates form values against
introspected [FieldDefinition](/api/forms/type-aliases/fielddefinition/) rules.

Checks required fields, string length constraints, numeric range constraints,
regex patterns, and any custom `validate` functions from [FieldConfig](/api/forms/type-aliases/fieldconfig/) overrides.
Schema-derived rules (from [introspectTable](/api/forms/functions/introspecttable/)) and custom rules (from [v](/api/forms/functions/v/))
are both enforced.

## Parameters

### fields

[`FieldDefinition`](/api/forms/type-aliases/fielddefinition/)[]

The [FieldDefinition](/api/forms/type-aliases/fielddefinition/) array to validate against (from [introspectTable](/api/forms/functions/introspecttable/)).

### fieldOverrides?

`Partial`\<`Record`\<`string`, [`FieldConfig`](/api/forms/type-aliases/fieldconfig/)\>\>

Optional per-field [FieldConfig](/api/forms/type-aliases/fieldconfig/) overrides, including custom `validate` functions.

## Returns

`Resolver`\<`FieldValues`\>

A react-hook-form `Resolver` that validates form values and returns errors.

## Example

```ts
import { introspectTable, createResolver } from "@cfast/forms";
import { posts } from "./schema";
import { useForm } from "react-hook-form";

const fields = introspectTable(posts);
const resolver = createResolver(fields, {
  title: { validate: (v) => (v === "test" ? "No test titles" : undefined) },
});
const form = useForm({ resolver });
```
