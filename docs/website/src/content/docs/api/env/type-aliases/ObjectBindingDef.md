---
editUrl: false
next: false
prev: false
title: "ObjectBindingDef"
---

> **ObjectBindingDef** = `object`

Defined in: [packages/env/src/types.ts:108](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L108)

Binding definition for an object-type Cloudflare binding
(D1, KV, R2, Queue, Durable Object, or Service).

Object bindings are validated via duck-type method checks at startup.

## Example

```typescript
const schema = {
  DB: { type: "d1" as const },
  CACHE: { type: "kv" as const },
  UPLOADS: { type: "r2" as const },
};
```

## Properties

### type

> **type**: `Exclude`\<[`BindingType`](/api/env/type-aliases/bindingtype/), `"var"` \| `"secret"`\>

Defined in: [packages/env/src/types.ts:110](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L110)

The Cloudflare binding type: `"d1"`, `"kv"`, `"r2"`, `"queue"`, `"durable-object"`, or `"service"`.
