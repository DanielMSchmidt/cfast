---
editUrl: false
next: false
prev: false
title: "ParsedEnv"
---

> **ParsedEnv**\<`S`\> = `{ [K in keyof S]: BindingTypeMap[S[K]["type"]] }`

Defined in: [packages/env/src/types.ts:185](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L185)

Mapped type that resolves a [Schema](/api/env/type-aliases/schema/) to its validated environment object.

Each key in the schema maps to the TypeScript type corresponding to its
binding type (e.g., a `d1` binding becomes `D1Database`, a `"secret"` becomes `string`).

## Type Parameters

### S

`S` *extends* [`Schema`](/api/env/type-aliases/schema/)

The env schema type.

## Example

```typescript
const schema = {
  DB: { type: "d1" as const },
  API_KEY: { type: "secret" as const },
};
type Env = ParsedEnv<typeof schema>;
// { DB: D1Database; API_KEY: string }
```
