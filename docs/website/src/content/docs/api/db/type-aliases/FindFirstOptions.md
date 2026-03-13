---
editUrl: false
next: false
prev: false
title: "FindFirstOptions"
---

> **FindFirstOptions** = `Omit`\<[`FindManyOptions`](/api/db/type-aliases/findmanyoptions/), `"limit"` \| `"offset"`\>

Defined in: [packages/db/src/types.ts:210](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L210)

Options for `db.query(table).findFirst()`.

Same as [FindManyOptions](/api/db/type-aliases/findmanyoptions/) without `limit`/`offset` (returns the first match or `undefined`).

## Example

```ts
db.query(posts).findFirst({
  where: eq(posts.id, "abc-123"),
});
```
