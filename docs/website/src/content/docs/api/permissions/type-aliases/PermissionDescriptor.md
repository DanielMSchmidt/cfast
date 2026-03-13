---
editUrl: false
next: false
prev: false
title: "PermissionDescriptor"
---

> **PermissionDescriptor** = `object`

Defined in: [packages/permissions/src/types.ts:117](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L117)

Structural description of a permission requirement.

Describes *what kind* of operation on *which table* without specifying concrete row values.
This is what makes client-side permission introspection possible: you can check whether a
role has the right grants without knowing the specific row being accessed.

## Example

```typescript
const descriptor: PermissionDescriptor = {
  action: "update",
  table: posts,
};
```

## Properties

### action

> **action**: [`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

Defined in: [packages/permissions/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L119)

The operation being checked.

***

### table

> **table**: [`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

Defined in: [packages/permissions/src/types.ts:121](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L121)

The Drizzle table the operation targets.
