---
editUrl: false
next: false
prev: false
title: "PermissionGateProps"
---

> **PermissionGateProps** = `object`

Defined in: [packages/ui/src/types.ts:673](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L673)

Props for the PermissionGate component.
Conditionally renders children based on action permission status.

## Properties

### action

> **action**: `ActionHookResult`

Defined in: [packages/ui/src/types.ts:675](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L675)

Action hook result providing permission status.

***

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:677](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L677)

Content rendered when the action is permitted.

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [packages/ui/src/types.ts:679](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L679)

Content rendered when the action is forbidden but not invisible.
