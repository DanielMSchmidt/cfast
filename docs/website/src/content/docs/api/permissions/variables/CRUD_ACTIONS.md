---
editUrl: false
next: false
prev: false
title: "CRUD_ACTIONS"
---

> `const` **CRUD\_ACTIONS**: readonly [`CrudAction`](/api/permissions/type-aliases/crudaction/)[]

Defined in: [packages/permissions/src/types.ts:61](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L61)

Readonly array of the four CRUD action strings, useful for iteration.

## Example

```typescript
import { CRUD_ACTIONS } from "@cfast/permissions";

for (const action of CRUD_ACTIONS) {
  console.log(action); // "read", "create", "update", "delete"
}
```
