---
editUrl: false
next: false
prev: false
title: "PermissionGateProps"
---

> **PermissionGateProps** = `object`

Defined in: [packages/ui/src/types.ts:1049](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1049)

Props for the PermissionGate component.

Conditionally renders children based on action permission status from
`@cfast/actions`. When the action is permitted, `children` is rendered.
When forbidden but not invisible, `fallback` is rendered. When the action
is invisible (no relation at all), nothing is rendered.

## See

[WhenForbidden](/api/ui/type-aliases/whenforbidden/) for the related behavior modes used by ActionButton.

## Properties

### action

> **action**: `ActionHookResult`

Defined in: [packages/ui/src/types.ts:1051](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1051)

Action hook result providing permission status.

***

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1053](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1053)

Content rendered when the action is permitted.

***

### fallback?

> `optional` **fallback**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1055](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1055)

Content rendered when the action is forbidden but not invisible.
