---
editUrl: false
next: false
prev: false
title: "WhenForbidden"
---

> **WhenForbidden** = `"hide"` \| `"disable"` \| `"show"`

Defined in: [packages/ui/src/types.ts:370](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L370)

Behavior when a `@cfast/actions` action is not permitted for the current user.

Controls how permission-aware components like [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/) and
sidebar [NavigationItem](/api/ui/type-aliases/navigationitem/) entries respond to forbidden actions:

- `"hide"` -- the component is not rendered at all.
- `"disable"` -- the component is rendered but non-interactive (grayed out).
- `"show"` -- the component is rendered and interactive regardless of permissions.
