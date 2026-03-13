---
editUrl: false
next: false
prev: false
title: "Schema"
---

> **Schema** = `Record`\<`string`, [`BindingDef`](/api/env/type-aliases/bindingdef/)\>

Defined in: [packages/env/src/types.ts:152](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L152)

A record mapping binding names to their [BindingDef](/api/env/type-aliases/bindingdef/) definitions.

Passed to [defineEnv](/api/env/functions/defineenv/) to declare the expected Cloudflare Worker bindings.

## Example

```typescript
const schema: Schema = {
  DB: { type: "d1" },
  API_KEY: { type: "secret" },
  LOG_LEVEL: { type: "var", default: "info" },
};
```
