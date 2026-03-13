---
editUrl: false
next: false
prev: false
title: "FieldComponentProps"
---

> **FieldComponentProps** = `object`

Defined in: [packages/forms/src/types.ts:109](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L109)

Props passed to field components by the auto-generated form.

Both built-in plugin components and custom components provided via
[FieldConfig.component](/api/forms/type-aliases/fieldconfig/#component) receive these props.

## Properties

### enumValues?

> `optional` **enumValues**: `string`[]

Defined in: [packages/forms/src/types.ts:121](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L121)

Available options for select/enum fields.

***

### error?

> `optional` **error**: `string`

Defined in: [packages/forms/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L119)

Validation error message, if any.

***

### label

> **label**: `string`

Defined in: [packages/forms/src/types.ts:113](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L113)

Human-readable label for the field.

***

### name

> **name**: `string`

Defined in: [packages/forms/src/types.ts:111](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L111)

The field name, used as the form registration key.

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [packages/forms/src/types.ts:115](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L115)

Optional placeholder text for the input.

***

### register

> **register**: `UseFormRegister`\<`FieldValues`\>

Defined in: [packages/forms/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L123)

The react-hook-form `register` function for binding the input to form state.

***

### required

> **required**: `boolean`

Defined in: [packages/forms/src/types.ts:117](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L117)

Whether the field is required (NOT NULL in the schema).
