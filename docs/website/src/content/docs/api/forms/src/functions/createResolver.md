---
editUrl: false
next: false
prev: false
title: "createResolver"
---

> **createResolver**(`fields`, `fieldOverrides?`): `Resolver`\<`FieldValues`\>

Defined in: [packages/forms/src/resolver.ts:62](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/resolver.ts#L62)

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
