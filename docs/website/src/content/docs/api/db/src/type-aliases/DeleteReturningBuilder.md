---
editUrl: false
next: false
prev: false
title: "DeleteReturningBuilder"
---

> **DeleteReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:243](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L243)

A delete operation that optionally returns the deleted row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the deleted row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
