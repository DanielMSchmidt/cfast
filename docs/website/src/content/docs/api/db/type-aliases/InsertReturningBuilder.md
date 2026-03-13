---
editUrl: false
next: false
prev: false
title: "InsertReturningBuilder"
---

> **InsertReturningBuilder** = [`Operation`](/api/db/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:474](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L474)

An insert [Operation](/api/db/type-aliases/operation/) that optionally returns the inserted row via `.returning()`.

Without `.returning()`, the operation resolves to `void`. With `.returning()`,
it resolves to the full inserted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the inserted row back from D1.

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>
