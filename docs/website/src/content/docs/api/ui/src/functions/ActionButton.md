---
editUrl: false
next: false
prev: false
title: "ActionButton"
---

> **ActionButton**(`__namedParameters`): `Element` \| `null`

Defined in: [packages/ui/src/components/action-button.tsx:15](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/components/action-button.tsx#L15)

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
