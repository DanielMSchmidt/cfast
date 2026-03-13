---
editUrl: false
next: false
prev: false
title: "SecretBindingDef"
---

> **SecretBindingDef** = `object`

Defined in: [packages/env/src/types.ts:125](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/env/src/types.ts#L125)

Binding definition for a secret (non-empty string, no defaults allowed).

Secrets are set via `wrangler secret put` and must be non-empty at runtime.

## Example

```typescript
const schema = {
  MAILGUN_API_KEY: { type: "secret" as const },
};
```

## Properties

### type

> **type**: `"secret"`

Defined in: [packages/env/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/env/src/types.ts#L127)

Must be `"secret"` to identify this as a secret string binding.
