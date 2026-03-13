---
editUrl: false
next: false
prev: false
title: "Serializable"
---

> **Serializable** = `string` \| `number` \| `boolean` \| `null` \| `Serializable`[] \| \{\[`key`: `string`\]: `Serializable`; \}

Defined in: [packages/actions/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L10)

A JSON-serializable value that can safely cross the server/client boundary.

Used to constrain loader data so that [ActionDefinition.loader](/api/actions/type-aliases/actiondefinition/#loader) and
[ComposedActions.loader](/api/actions/type-aliases/composedactions/#loader) can merge `_actionPermissions` into it.
