---
editUrl: false
next: false
prev: false
title: "v"
---

> **v**\<`T`\>(`builder`, `rules`): `T`

Defined in: [packages/forms/src/validate.ts:20](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/forms/src/validate.ts#L20)

Attach validation rules to a Drizzle column builder.
The rules are stored on the builder's internal config object via a Symbol,
which Drizzle passes through to the built Column instance.

## Type Parameters

### T

`T` *extends* `ColumnBuilderBase`\<`ColumnBuilderBaseConfig`\<`ColumnDataType`, `string`\>, `object`\>

## Parameters

### builder

`T`

### rules

[`ValidationRules`](/api/forms/src/type-aliases/validationrules/)

## Returns

`T`

## Example

```ts
const posts = sqliteTable("posts", {
  title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
  views: v(integer("views"), { min: 0 }),
});
```
