---
editUrl: false
next: false
prev: false
title: "DeleteReturningBuilder"
---

> **DeleteReturningBuilder** = [`Operation`](/api/db/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:541](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L541)

A delete [Operation](/api/db/type-aliases/operation/) that optionally returns the deleted row via `.returning()`.

Without `.returning()`, the operation resolves to `void`. With `.returning()`,
it resolves to the full deleted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the deleted row back from D1.

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>
