---
editUrl: false
next: false
prev: false
title: "VarBindingDef"
---

> **VarBindingDef** = `object`

Defined in: [packages/env/src/types.ts:37](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L37)

Binding definition for a `var` (string environment variable).

Supports optional defaults (simple string or per-environment) and
an optional validation callback.

## Properties

### default?

> `optional` **default**: `string` \| [`EnvironmentDefaults`](/api/env/src/type-aliases/environmentdefaults/)

Defined in: [packages/env/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L39)

***

### type

> **type**: `"var"`

Defined in: [packages/env/src/types.ts:38](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L38)

***

### validate()?

> `optional` **validate**: (`value`) => `boolean`

Defined in: [packages/env/src/types.ts:40](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L40)

#### Parameters

##### value

`string`

#### Returns

`boolean`
