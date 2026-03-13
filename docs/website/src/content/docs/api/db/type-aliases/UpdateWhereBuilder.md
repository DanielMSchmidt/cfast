---
editUrl: false
next: false
prev: false
title: "UpdateWhereBuilder"
---

> **UpdateWhereBuilder** = `object`

Defined in: [packages/db/src/types.ts:503](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L503)

Intermediate builder requiring a WHERE condition before the update can execute.

The WHERE condition is AND'd with any permission-based WHERE clauses from the user's grants.

## Properties

### where()

> **where**: (`condition`) => [`UpdateReturningBuilder`](/api/db/type-aliases/updatereturningbuilder/)

Defined in: [packages/db/src/types.ts:505](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L505)

Specifies the WHERE condition (AND'd with permission filters at `.run()` time).

#### Parameters

##### condition

`unknown`

#### Returns

[`UpdateReturningBuilder`](/api/db/type-aliases/updatereturningbuilder/)
