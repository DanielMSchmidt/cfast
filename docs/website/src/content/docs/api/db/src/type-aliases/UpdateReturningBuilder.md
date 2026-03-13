---
editUrl: false
next: false
prev: false
title: "UpdateReturningBuilder"
---

> **UpdateReturningBuilder** = [`Operation`](/api/db/src/type-aliases/operation/)\<`void`\> & `object`

Defined in: [packages/db/src/types.ts:231](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L231)

An update operation that optionally returns the updated row.

## Type Declaration

### returning()

> **returning**: () => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>

Chains `.returning()` to get the updated row back.

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>
