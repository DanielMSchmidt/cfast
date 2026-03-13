---
editUrl: false
next: false
prev: false
title: "ActionPermissionsMap"
---

> **ActionPermissionsMap** = `Record`\<`string`, [`ActionPermissionStatus`](/api/actions/type-aliases/actionpermissionstatus/)\>

Defined in: [packages/actions/src/types.ts:134](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L134)

A map from action name to its [ActionPermissionStatus](/api/actions/type-aliases/actionpermissionstatus/).

Injected into loader data under the `_actionPermissions` key by
[ActionDefinition.loader](/api/actions/type-aliases/actiondefinition/#loader) or [ComposedActions.loader](/api/actions/type-aliases/composedactions/#loader).
