---
editUrl: false
next: false
prev: false
title: "DeleteReturningBuilder"
---

> **DeleteReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:243](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L243)

A delete operation that optionally returns the deleted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the deleted row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
