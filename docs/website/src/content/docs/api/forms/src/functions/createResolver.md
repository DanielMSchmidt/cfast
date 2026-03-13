---
editUrl: false
next: false
prev: false
title: "createResolver"
---

> **createResolver**(`fields`, `fieldOverrides?`): `Resolver`\<`FieldValues`\>

Defined in: [packages/forms/src/resolver.ts:62](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/forms/src/resolver.ts#L62)

Create a react-hook-form resolver that validates against introspected field definitions.

## Parameters

### fields

[`FieldDefinition`](/api/forms/src/type-aliases/fielddefinition/)[]

The field definitions to validate against.

### fieldOverrides?

`Partial`\<`Record`\<`string`, [`FieldConfig`](/api/forms/src/type-aliases/fieldconfig/)\>\>

Optional per-field configuration including custom validators.

## Returns

`Resolver`\<`FieldValues`\>

A react-hook-form Resolver.
