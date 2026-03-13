---
editUrl: false
next: false
prev: false
title: "UpdateReturningBuilder"
---

> **UpdateReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:231](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L231)

An update operation that optionally returns the updated row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the updated row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
