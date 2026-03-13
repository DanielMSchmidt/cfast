---
editUrl: false
next: false
prev: false
title: "compose"
---

> **compose**\<`TResult`\>(`operations`, `executor`): [`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/db/src/compose.ts:47](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/compose.ts#L47)

Merges multiple [Operations](/api/db/type-aliases/operation/) into a single operation with combined,
deduplicated permissions and an executor function for controlling data flow.

`compose()` itself does not check permissions -- it only merges them. Each sub-operation's
`.run()` still performs its own permission check when the executor calls it. This enables
data dependencies between operations (e.g., using an insert result's ID in an audit log).

## Type Parameters

### TResult

`TResult`

The return type of the executor function.

## Parameters

### operations

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`\>[]

The operations to compose. Their permissions are merged and deduplicated.

### executor

(...`runs`) => `TResult` \| `Promise`\<`TResult`\>

A function that receives a `run` function for each operation (in order).
  You control execution order, data flow between operations, and the return value.

## Returns

[`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

A single [Operation](/api/db/type-aliases/operation/) with combined permissions.

## Example

```ts
import { compose } from "@cfast/db";

const publishWorkflow = compose(
  [updatePost, insertAuditLog],
  async (doUpdate, doAudit) => {
    const updated = await doUpdate({});
    await doAudit({});
    return { published: true };
  },
);

// Inspect combined permissions
publishWorkflow.permissions;
// => [{ action: "update", table: "posts" }, { action: "create", table: "audit_logs" }]

// Execute all sub-operations
await publishWorkflow.run({});
```
