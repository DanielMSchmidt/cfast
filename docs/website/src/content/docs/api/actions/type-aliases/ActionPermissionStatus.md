---
editUrl: false
next: false
prev: false
title: "ActionPermissionStatus"
---

> **ActionPermissionStatus** = `object`

Defined in: [packages/actions/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L119)

The resolved permission status for a single action.

Computed by [checkPermissionStatus](/api/actions/functions/checkpermissionstatus/) and sent to the client
via `_actionPermissions` in loader data.

## Properties

### invisible

> **invisible**: `boolean`

Defined in: [packages/actions/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L123)

`true` when the user lacks every permission — the UI should hide the control entirely.

***

### permitted

> **permitted**: `boolean`

Defined in: [packages/actions/src/types.ts:121](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L121)

Whether the user has all required permissions for this action.

***

### reason

> **reason**: `string` \| `null`

Defined in: [packages/actions/src/types.ts:125](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L125)

Human-readable explanation when `permitted` is `false`, otherwise `null`.
