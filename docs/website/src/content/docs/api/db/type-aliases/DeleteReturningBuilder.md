---
editUrl: false
next: false
prev: false
title: "DeleteReturningBuilder"
---

> **DeleteReturningBuilder** = [`Operation`](/api/db/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:541](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L541)

A delete [Operation](/api/db/type-aliases/operation/) that optionally returns the deleted row via `.returning()`.

Without `.returning()`, the operation resolves to `void`. With `.returning()`,
it resolves to the full deleted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the deleted row back from D1.

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>
