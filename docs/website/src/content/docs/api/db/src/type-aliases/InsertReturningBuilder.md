---
editUrl: false
next: false
prev: false
title: "InsertReturningBuilder"
---

> **InsertReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:213](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L213)

An insert operation that optionally returns the inserted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the inserted row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
