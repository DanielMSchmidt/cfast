---
editUrl: false
next: false
prev: false
title: "UpdateWhereBuilder"
---

> **UpdateWhereBuilder** = `object`

Defined in: [packages/db/src/types.ts:225](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L225)

Intermediate builder requiring a WHERE condition for updates.

## Properties

### where()

> **where**: (`condition`) => [`UpdateReturningBuilder`](/api/db/src/type-aliases/updatereturningbuilder/)

Defined in: [packages/db/src/types.ts:227](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L227)

Specifies the WHERE condition (AND'd with permission filters).

#### Parameters

##### condition

`unknown`

#### Returns

[`UpdateReturningBuilder`](/api/db/src/type-aliases/updatereturningbuilder/)
