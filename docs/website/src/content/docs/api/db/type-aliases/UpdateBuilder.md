---
editUrl: false
next: false
prev: false
title: "UpdateBuilder"
---

> **UpdateBuilder** = `object`

Defined in: [packages/db/src/types.ts:493](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L493)

Builder for update operations on a single table.

Returned by `db.update(table)`. Chain `.set()` to specify values, then `.where()`
to add a condition, and optionally `.returning()` to get the updated row back.

## Example

```ts
await db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, "abc-123"))
  .run({});
```

## Properties

### set()

> **set**: (`values`) => [`UpdateWhereBuilder`](/api/db/type-aliases/updatewherebuilder/)

Defined in: [packages/db/src/types.ts:495](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L495)

Specifies the column values to update, returning an [UpdateWhereBuilder](/api/db/type-aliases/updatewherebuilder/).

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

#### Returns

[`UpdateWhereBuilder`](/api/db/type-aliases/updatewherebuilder/)
