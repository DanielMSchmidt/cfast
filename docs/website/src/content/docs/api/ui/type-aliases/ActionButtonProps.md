---
editUrl: false
next: false
prev: false
title: "ActionButtonProps"
---

> **ActionButtonProps** = `object` & `Omit`\<[`ButtonSlotProps`](/api/ui/type-aliases/buttonslotprops/), `ActionButtonControlledProps`\>

Defined in: [packages/ui/src/types.ts:1026](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1026)

Props for the ActionButton component.

Wraps a `@cfast/actions` action with permission-aware behavior and optional
confirmation dialog. Extends [ButtonSlotProps](/api/ui/type-aliases/buttonslotprops/) (excluding internally
controlled props) so all button styling options are available.

## Type Declaration

### action

> **action**: `ActionHookResult`

Action hook result from `useActions()`, providing permission status and submit function.

### children

> **children**: `ReactNode`

Button label content.

### confirmation?

> `optional` **confirmation**: `string` \| [`ConfirmOptions`](/api/ui/type-aliases/confirmoptions/)

Confirmation message or options shown before executing the action.

### whenForbidden?

> `optional` **whenForbidden**: [`WhenForbidden`](/api/ui/type-aliases/whenforbidden/)

Behavior when the action is not permitted. Defaults to "disable".

## See

 - [WhenForbidden](/api/ui/type-aliases/whenforbidden/) for the permission behavior modes.
 - [ConfirmOptions](/api/ui/type-aliases/confirmoptions/) for confirmation dialog configuration.
 - [ButtonSlotProps](/api/ui/type-aliases/buttonslotprops/) for the inherited button styling props.
