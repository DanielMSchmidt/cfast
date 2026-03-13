---
editUrl: false
next: false
prev: false
title: "InsertBuilder"
---

> **InsertBuilder** = `object`

Defined in: [packages/db/src/types.ts:463](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L463)

Builder for insert operations on a single table.

Returned by `db.insert(table)`. Chain `.values()` to set the row data,
then optionally `.returning()` to get the inserted row back.

## Example

```ts
// Insert without returning
await db.insert(posts).values({ title: "Hello", authorId: user.id }).run({});

// Insert with returning
const row = await db.insert(posts)
  .values({ title: "Hello", authorId: user.id })
  .returning()
  .run({});
```

## Properties

### values()

> **values**: (`values`) => [`InsertReturningBuilder`](/api/db/type-aliases/insertreturningbuilder/)

Defined in: [packages/db/src/types.ts:465](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L465)

Specifies the column values to insert, returning an [InsertReturningBuilder](/api/db/type-aliases/insertreturningbuilder/).

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

#### Returns

[`InsertReturningBuilder`](/api/db/type-aliases/insertreturningbuilder/)
