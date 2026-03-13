---
editUrl: false
next: false
prev: false
title: "checkPermissionStatus"
---

> **checkPermissionStatus**(`grants`, `descriptors`): [`ActionPermissionStatus`](/api/actions/type-aliases/actionpermissionstatus/)

Defined in: [packages/actions/src/create-actions.ts:42](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/create-actions.ts#L42)

Checks a user's [grants](/api/permissions/type-aliases/grant/) against a set of permission descriptors
and returns an [ActionPermissionStatus](/api/actions/type-aliases/actionpermissionstatus/).

If no descriptors are provided the action is unconditionally permitted.
When some descriptors are denied, `permitted` is `false` and `reason`
lists the missing permissions. When *all* descriptors are denied,
`invisible` is also `true` (indicating the UI should hide the control entirely).

## Parameters

### grants

[`Grant`](/api/permissions/type-aliases/grant/)[]

The user's resolved permission grants.

### descriptors

[`PermissionDescriptor`](/api/permissions/type-aliases/permissiondescriptor/)[]

Permission descriptors extracted from an operation.

## Returns

[`ActionPermissionStatus`](/api/actions/type-aliases/actionpermissionstatus/)

The resolved [ActionPermissionStatus](/api/actions/type-aliases/actionpermissionstatus/) for the action.

## Example

```ts
import { checkPermissionStatus } from "@cfast/actions";

const status = checkPermissionStatus(user.grants, operation.permissions);
if (!status.permitted) {
  console.log(status.reason); // "Missing permissions: delete on posts"
}
```
