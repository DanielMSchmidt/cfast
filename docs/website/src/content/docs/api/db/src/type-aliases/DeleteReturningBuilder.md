---
editUrl: false
next: false
prev: false
title: "DeleteReturningBuilder"
---

> **DeleteReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:243](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L243)

A delete operation that optionally returns the deleted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the deleted row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
