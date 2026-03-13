---
editUrl: false
next: false
prev: false
title: "PermissionGate"
---

> **PermissionGate**(`__namedParameters`): `Element` \| `null`

Defined in: [packages/ui/src/components/permission-gate.tsx:12](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/components/permission-gate.tsx#L12)

Conditionally renders children based on action permission status.

Takes an `ActionHookResult` from `useActions()`.

- When permitted: renders children
- When forbidden (not permitted, not invisible): renders fallback
- When invisible: renders nothing

## Parameters

### \_\_namedParameters

[`PermissionGateProps`](/api/ui/src/type-aliases/permissiongateprops/)

## Returns

`Element` \| `null`
