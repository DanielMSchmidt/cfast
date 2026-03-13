---
editUrl: false
next: false
prev: false
title: "UpdateReturningBuilder"
---

> **UpdateReturningBuilder** = [`Operation`](/api/db/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:514](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L514)

An update [Operation](/api/db/type-aliases/operation/) that optionally returns the updated row via `.returning()`.

Without `.returning()`, the operation resolves to `void`. With `.returning()`,
it resolves to the full updated row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the updated row back from D1.

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>
