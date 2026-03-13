---
editUrl: false
next: false
prev: false
title: "DeleteBuilder"
---

> **DeleteBuilder** = `object`

Defined in: [packages/db/src/types.ts:237](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L237)

Builder for delete operations.

## Properties

### where()

> **where**: (`condition`) => [`DeleteReturningBuilder`](/api/db/src/type-aliases/deletereturningbuilder/)

Defined in: [packages/db/src/types.ts:239](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L239)

Specifies the WHERE condition (AND'd with permission filters).

#### Parameters

##### condition

`unknown`

#### Returns

[`DeleteReturningBuilder`](/api/db/src/type-aliases/deletereturningbuilder/)
