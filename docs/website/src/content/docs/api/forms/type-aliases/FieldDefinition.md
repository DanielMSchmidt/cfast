---
editUrl: false
next: false
prev: false
title: "FieldDefinition"
---

> **FieldDefinition** = `object`

Defined in: [packages/forms/src/types.ts:48](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L48)

A field definition produced by [introspectTable](/api/forms/functions/introspecttable/), describing a single form field.

Contains all metadata needed to render and validate a field: input type, label,
required status, enum options, and validation rules derived from both the Drizzle
schema and any rules attached via [v](/api/forms/functions/v/).

## Properties

### enumValues?

> `optional` **enumValues**: `string`[]

Defined in: [packages/forms/src/types.ts:62](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L62)

Available options for enum/select fields, copied from the Drizzle column definition.

***

### hasDefault

> **hasDefault**: `boolean`

Defined in: [packages/forms/src/types.ts:58](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L58)

Whether the column has a default value defined in the schema.

***

### inputType

> **inputType**: [`InputType`](/api/forms/type-aliases/inputtype/)

Defined in: [packages/forms/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L52)

The resolved input type based on the Drizzle column type.

***

### isPrimaryKey

> **isPrimaryKey**: `boolean`

Defined in: [packages/forms/src/types.ts:60](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L60)

Whether the column is the table's primary key.

***

### label

> **label**: `string`

Defined in: [packages/forms/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L54)

Human-readable label derived from the column name (e.g., `"Author Id"` from `"authorId"`).

***

### name

> **name**: `string`

Defined in: [packages/forms/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L50)

The column key from the Drizzle table (e.g., `"title"`, `"authorId"`).

***

### required

> **required**: `boolean`

Defined in: [packages/forms/src/types.ts:56](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L56)

Whether the column is NOT NULL (and therefore required in the form).

***

### validation

> **validation**: [`ValidationRules`](/api/forms/type-aliases/validationrules/)

Defined in: [packages/forms/src/types.ts:64](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L64)

Merged validation rules from schema introspection and [v](/api/forms/functions/v/) annotations.
