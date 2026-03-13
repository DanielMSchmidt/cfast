---
editUrl: false
next: false
prev: false
title: "EnvironmentDefaults"
---

> **EnvironmentDefaults** = `Partial`\<`Record`\<[`EnvironmentName`](/api/env/type-aliases/environmentname/), `string`\>\>

Defined in: [packages/env/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/env/src/types.ts#L65)

Per-environment default values for a `var` binding.

Keys are [EnvironmentName](/api/env/type-aliases/environmentname/) values; not every environment needs an entry.
When the current environment has no matching key and no value is provided,
`init()` throws an error.

## Example

```typescript
const defaults: EnvironmentDefaults = {
  development: "http://localhost:8787",
  staging: "https://staging.myapp.com",
  production: "https://myapp.com",
};
```
