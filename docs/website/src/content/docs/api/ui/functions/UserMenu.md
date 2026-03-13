---
editUrl: false
next: false
prev: false
title: "UserMenu"
---

> **UserMenu**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/user-menu.tsx:28](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/user-menu.tsx#L28)

Header dropdown showing the current user's avatar, name, email, role badges, and navigation links.

Reads the authenticated user via `useCurrentUser()` from `@cfast/auth`. Renders
an [AvatarWithInitials](/api/ui/functions/avatarwithinitials/) trigger and a dropdown with user info, [RoleBadge](/api/ui/functions/rolebadge/)
chips, permission-filtered navigation links, and an optional sign-out button.
Returns `null` when no user is authenticated.

## Parameters

### props

[`UserMenuProps`](/api/ui/type-aliases/usermenuprops/)

See [UserMenuProps](/api/ui/type-aliases/usermenuprops/).

## Returns

`Element` \| `null`

## Example

```tsx
<UserMenu
  links={[
    { label: "Profile", to: "/profile" },
    { label: "Admin", to: "/admin", action: adminAccess.client },
  ]}
  onSignOut={() => signOut()}
/>
```
