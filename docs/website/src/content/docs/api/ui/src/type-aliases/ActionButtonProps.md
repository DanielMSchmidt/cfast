---
editUrl: false
next: false
prev: false
title: "ActionButtonProps"
---

> **ActionButtonProps** = `object` & `Omit`\<[`ButtonSlotProps`](/api/ui/src/type-aliases/buttonslotprops/), `ActionButtonControlledProps`\>

Defined in: [packages/ui/src/types.ts:656](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L656)

Props for the ActionButton component.
Wraps a `@cfast/actions` action with permission-aware behavior and optional confirmation.

## Type Declaration

### action

> **action**: `ActionHookResult`

Action hook result from `useActions()`, providing permission status and submit function.

### children

> **children**: `ReactNode`

Button label content.

### confirmation?

> `optional` **confirmation**: `string` \| [`ConfirmOptions`](/api/ui/src/type-aliases/confirmoptions/)

Confirmation message or options shown before executing the action.

### whenForbidden?

> `optional` **whenForbidden**: [`WhenForbidden`](/api/ui/src/type-aliases/whenforbidden/)

Behavior when the action is not permitted. Defaults to "disable".
