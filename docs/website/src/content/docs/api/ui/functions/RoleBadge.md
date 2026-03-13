---
editUrl: false
next: false
prev: false
title: "RoleBadge"
---

> **RoleBadge**(`props`): `Element`

Defined in: [packages/ui/src/components/role-badge.tsx:27](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/role-badge.tsx#L27)

Colored badge displaying a user's role name.

Renders via the UI plugin's `chip` slot. Default color mapping:
admin = danger, editor = primary, author = success, reader = neutral.
Pass a custom `colors` map to override or extend the defaults.

## Parameters

### props

[`RoleBadgeProps`](/api/ui/type-aliases/rolebadgeprops/)

See [RoleBadgeProps](/api/ui/type-aliases/rolebadgeprops/).

## Returns

`Element`

## Example

```tsx
<RoleBadge role="admin" />
// Custom colors:
<RoleBadge role="moderator" colors={{ moderator: "warning" }} />
```
