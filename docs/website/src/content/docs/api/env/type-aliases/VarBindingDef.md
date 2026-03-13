---
editUrl: false
next: false
prev: false
title: "VarBindingDef"
---

> **VarBindingDef** = `object`

Defined in: [packages/env/src/types.ts:84](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L84)

Binding definition for a `var` (string environment variable).

Supports optional defaults (simple string or per-environment) and
an optional validation callback.

## Example

```typescript
const schema = {
  APP_URL: {
    type: "var" as const,
    default: "http://localhost:8787",
    validate: (v: string) => v.startsWith("http"),
  },
};
```

## Properties

### default?

> `optional` **default**: `string` \| [`EnvironmentDefaults`](/api/env/type-aliases/environmentdefaults/)

Defined in: [packages/env/src/types.ts:88](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L88)

Default value: a simple string, or a per-environment [EnvironmentDefaults](/api/env/type-aliases/environmentdefaults/) map.

***

### type

> **type**: `"var"`

Defined in: [packages/env/src/types.ts:86](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L86)

Must be `"var"` to identify this as a string variable binding.

***

### validate()?

> `optional` **validate**: (`value`) => `boolean`

Defined in: [packages/env/src/types.ts:90](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L90)

Optional validation callback. Return `true` to accept, `false` to reject.

#### Parameters

##### value

`string`

#### Returns

`boolean`
