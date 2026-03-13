---
editUrl: false
next: false
prev: false
title: "DeleteBuilder"
---

> **DeleteBuilder** = `object`

Defined in: [packages/db/src/types.ts:237](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L237)

Builder for delete operations.

## Properties

### where()

> **where**: (`condition`) => [`DeleteReturningBuilder`](/api/db/src/type-aliases/deletereturningbuilder/)

Defined in: [packages/db/src/types.ts:239](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L239)

Specifies the WHERE condition (AND'd with permission filters).

#### Parameters

##### condition

`unknown`

#### Returns

[`DeleteReturningBuilder`](/api/db/src/type-aliases/deletereturningbuilder/)
