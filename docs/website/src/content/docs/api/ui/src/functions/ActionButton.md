---
editUrl: false
next: false
prev: false
title: "ActionButton"
---

> **ActionButton**(`__namedParameters`): `Element` \| `null`

Defined in: [packages/ui/src/components/action-button.tsx:15](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/components/action-button.tsx#L15)

Permission-aware button that submits an action.

Takes an `ActionHookResult` from `useActions()` — no hooks inside,
pure presentation component. Extra props are forwarded to the
underlying button slot.

- whenForbidden="hide": hidden when not permitted
- whenForbidden="disable": shown but disabled when not permitted
- whenForbidden="show": shown and clickable regardless of permission

## Parameters

### \_\_namedParameters

[`ActionButtonProps`](/api/ui/src/type-aliases/actionbuttonprops/)

## Returns

`Element` \| `null`
