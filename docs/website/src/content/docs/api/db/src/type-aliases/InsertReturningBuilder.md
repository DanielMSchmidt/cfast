---
editUrl: false
next: false
prev: false
title: "InsertReturningBuilder"
---

> **InsertReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:213](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L213)

An insert operation that optionally returns the inserted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the inserted row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
