---
editUrl: false
next: false
prev: false
title: "PermissionGate"
---

> **PermissionGate**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/permission-gate.tsx:22](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/permission-gate.tsx#L22)

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
