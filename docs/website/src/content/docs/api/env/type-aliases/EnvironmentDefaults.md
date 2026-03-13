---
editUrl: false
next: false
prev: false
title: "EnvironmentDefaults"
---

> **EnvironmentDefaults** = `Partial`\<`Record`\<[`EnvironmentName`](/api/env/type-aliases/environmentname/), `string`\>\>

Defined in: [packages/env/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L65)

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
