---
editUrl: false
next: false
prev: false
title: "DeleteBuilder"
---

> **DeleteBuilder** = `object`

Defined in: [packages/db/src/types.ts:530](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L530)

Builder for delete operations on a single table.

Returned by `db.delete(table)`. Chain `.where()` to add a condition,
and optionally `.returning()` to get the deleted row back.

## Example

```ts
await db.delete(posts).where(eq(posts.id, "abc-123")).run({});
```

## Properties

### where()

> **where**: (`condition`) => [`DeleteReturningBuilder`](/api/db/type-aliases/deletereturningbuilder/)

Defined in: [packages/db/src/types.ts:532](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L532)

Specifies the WHERE condition (AND'd with permission filters at `.run()` time).

#### Parameters

##### condition

`unknown`

#### Returns

[`DeleteReturningBuilder`](/api/db/type-aliases/deletereturningbuilder/)
