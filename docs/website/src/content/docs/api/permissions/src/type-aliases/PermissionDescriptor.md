---
editUrl: false
next: false
prev: false
title: "PermissionDescriptor"
---

> **PermissionDescriptor** = `object`

Defined in: [packages/permissions/src/types.ts:77](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L77)

Structural description of a permission requirement.

Describes *what kind* of operation on *which table* without specifying concrete row values.
This is what makes client-side permission introspection possible.

## Properties

### action

> **action**: [`PermissionAction`](/api/permissions/src/type-aliases/permissionaction/)

Defined in: [packages/permissions/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L79)

The operation being checked.

***

### table

> **table**: [`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

Defined in: [packages/permissions/src/types.ts:81](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L81)

The Drizzle table the operation targets.
