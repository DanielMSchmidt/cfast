---
editUrl: false
next: false
prev: false
title: "UserMenuProps"
---

> **UserMenuProps** = `object`

Defined in: [packages/ui/src/types.ts:1170](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1170)

Props for the UserMenu component.

Header dropdown showing the current user's avatar, name, email, role badge,
impersonation indicator, configurable navigation links, and sign-out action.
Reads user data from `@cfast/auth`'s `useCurrentUser()`.

## See

 - [UserMenuLink](/api/ui/type-aliases/usermenulink/) for the link configuration.
 - [AvatarWithInitialsProps](/api/ui/type-aliases/avatarwithinitialsprops/) for the avatar display.
 - [RoleBadgeProps](/api/ui/type-aliases/rolebadgeprops/) for the role badge display.

## Properties

### links?

> `optional` **links**: [`UserMenuLink`](/api/ui/type-aliases/usermenulink/)[]

Defined in: [packages/ui/src/types.ts:1172](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1172)

Additional navigation links in the dropdown.

***

### onSignOut()?

> `optional` **onSignOut**: () => `void`

Defined in: [packages/ui/src/types.ts:1174](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1174)

Callback for the sign-out action.

#### Returns

`void`
