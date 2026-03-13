---
editUrl: false
next: false
prev: false
title: "Schema"
---

> **Schema** = `Record`\<`string`, [`BindingDef`](/api/env/type-aliases/bindingdef/)\>

Defined in: [packages/env/src/types.ts:152](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/env/src/types.ts#L152)

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
