---
editUrl: false
next: false
prev: false
title: "PermissionGate"
---

> **PermissionGate**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/permission-gate.tsx:22](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/permission-gate.tsx#L22)

Conditionally renders children based on action permission status.

Accepts an `ActionHookResult` from `useActions()` and controls rendering
based on the user's permission level:

- **Permitted**: renders `children`
- **Forbidden** (not permitted, not invisible): renders `fallback` if provided, otherwise nothing
- **Invisible**: renders nothing (the resource does not exist for this user)

## Parameters

### props

[`PermissionGateProps`](/api/ui/type-aliases/permissiongateprops/)

See [PermissionGateProps](/api/ui/type-aliases/permissiongateprops/).

## Returns

`Element` \| `null`

## Example

```tsx
<PermissionGate action={editPost} fallback={<ReadOnlyBanner />}>
  <EditToolbar />
</PermissionGate>
```
