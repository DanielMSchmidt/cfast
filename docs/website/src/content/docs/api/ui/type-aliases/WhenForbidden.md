---
editUrl: false
next: false
prev: false
title: "WhenForbidden"
---

> **WhenForbidden** = `"hide"` \| `"disable"` \| `"show"`

Defined in: [packages/ui/src/types.ts:370](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L370)

Behavior when a `@cfast/actions` action is not permitted for the current user.

Controls how permission-aware components like [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/) and
sidebar [NavigationItem](/api/ui/type-aliases/navigationitem/) entries respond to forbidden actions:

- `"hide"` -- the component is not rendered at all.
- `"disable"` -- the component is rendered but non-interactive (grayed out).
- `"show"` -- the component is rendered and interactive regardless of permissions.
