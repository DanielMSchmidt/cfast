---
editUrl: false
next: false
prev: false
title: "UpdateWhereBuilder"
---

> **UpdateWhereBuilder** = `object`

Defined in: [packages/db/src/types.ts:225](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L225)

Intermediate builder requiring a WHERE condition for updates.

## Properties

### where()

> **where**: (`condition`) => [`UpdateReturningBuilder`](/api/db/src/type-aliases/updatereturningbuilder/)

Defined in: [packages/db/src/types.ts:227](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L227)

Specifies the WHERE condition (AND'd with permission filters).

#### Parameters

##### condition

`unknown`

#### Returns

[`UpdateReturningBuilder`](/api/db/src/type-aliases/updatereturningbuilder/)
