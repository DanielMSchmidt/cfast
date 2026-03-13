---
editUrl: false
next: false
prev: false
title: "CRUD_ACTIONS"
---

> `const` **CRUD\_ACTIONS**: readonly [`CrudAction`](/api/permissions/type-aliases/crudaction/)[]

Defined in: [packages/permissions/src/types.ts:61](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L61)

Readonly array of the four CRUD action strings, useful for iteration.

## Example

```typescript
import { CRUD_ACTIONS } from "@cfast/permissions";

for (const action of CRUD_ACTIONS) {
  console.log(action); // "read", "create", "update", "delete"
}
```
