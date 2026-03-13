---
editUrl: false
next: false
prev: false
title: "ActionButton"
---

> **ActionButton**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/action-button.tsx:29](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/action-button.tsx#L29)

Permission-aware button that submits a `@cfast/actions` action.

Accepts an `ActionHookResult` from `useActions()` and renders a button
via the UI plugin's `button` slot. The button's visibility and disabled
state are controlled by the action's permission status. Extra props are
forwarded to the underlying button component.

- `whenForbidden="hide"` -- hidden when not permitted
- `whenForbidden="disable"` -- shown but disabled when not permitted (default)
- `whenForbidden="show"` -- shown and clickable regardless of permission

## Parameters

### props

[`ActionButtonProps`](/api/ui/type-aliases/actionbuttonprops/)

See [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/).

## Returns

`Element` \| `null`

## Example

```tsx
<ActionButton
  action={publishPost}
  whenForbidden="disable"
  confirmation="Publish this post?"
>
  Publish
</ActionButton>
```
