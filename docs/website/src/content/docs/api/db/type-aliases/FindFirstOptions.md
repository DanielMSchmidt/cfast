---
editUrl: false
next: false
prev: false
title: "FindFirstOptions"
---

> **FindFirstOptions** = `Omit`\<[`FindManyOptions`](/api/db/type-aliases/findmanyoptions/), `"limit"` \| `"offset"`\>

Defined in: [packages/db/src/types.ts:210](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L210)

Options for `db.query(table).findFirst()`.

Same as [FindManyOptions](/api/db/type-aliases/findmanyoptions/) without `limit`/`offset` (returns the first match or `undefined`).

## Example

```ts
db.query(posts).findFirst({
  where: eq(posts.id, "abc-123"),
});
```
