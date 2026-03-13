---
editUrl: false
next: false
prev: false
title: "UpdateWhereBuilder"
---

> **UpdateWhereBuilder** = `object`

Defined in: [packages/db/src/types.ts:503](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L503)

Intermediate builder requiring a WHERE condition before the update can execute.

The WHERE condition is AND'd with any permission-based WHERE clauses from the user's grants.

## Properties

### where()

> **where**: (`condition`) => [`UpdateReturningBuilder`](/api/db/type-aliases/updatereturningbuilder/)

Defined in: [packages/db/src/types.ts:505](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L505)

Specifies the WHERE condition (AND'd with permission filters at `.run()` time).

#### Parameters

##### condition

`unknown`

#### Returns

[`UpdateReturningBuilder`](/api/db/type-aliases/updatereturningbuilder/)
