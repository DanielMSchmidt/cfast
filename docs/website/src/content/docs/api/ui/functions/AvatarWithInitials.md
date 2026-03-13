---
editUrl: false
next: false
prev: false
title: "AvatarWithInitials"
---

> **AvatarWithInitials**(`props`): `Element`

Defined in: [packages/ui/src/components/avatar-with-initials.tsx:46](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/avatar-with-initials.tsx#L46)

Avatar component with automatic initials fallback.

Renders an `<img>` when a `src` URL is provided. When `src` is absent or null,
displays the user's initials (derived via [getInitials](/api/ui/functions/getinitials/)) inside a circular
badge. This is the headless implementation; styled versions are provided by UI plugins.

## Parameters

### props

[`AvatarWithInitialsProps`](/api/ui/type-aliases/avatarwithinitialsprops/)

See [AvatarWithInitialsProps](/api/ui/type-aliases/avatarwithinitialsprops/).

## Returns

`Element`

## Example

```tsx
<AvatarWithInitials
  src={user.avatarUrl}
  name={user.name}
  size="sm"
/>
```
