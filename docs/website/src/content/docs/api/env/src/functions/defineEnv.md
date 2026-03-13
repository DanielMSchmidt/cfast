---
editUrl: false
next: false
prev: false
title: "defineEnv"
---

> **defineEnv**\<`S`\>(`schema`): `Env`\<`S`\>

Defined in: [packages/env/src/define-env.ts:58](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/env/src/define-env.ts#L58)

Creates a type-safe, runtime-validated environment object for Cloudflare Worker bindings.

Declare your bindings once and get a fully typed environment. Validation runs once
at startup via `init()`, catching missing or misconfigured bindings before any
request is processed.

## Type Parameters

### S

`S` *extends* [`Schema`](/api/env/src/type-aliases/schema/)

## Parameters

### schema

`S`

A record mapping binding names to their definitions (type, defaults, validation).

## Returns

`Env`\<`S`\>

An object with `init()` and `get()` methods for initializing and accessing the typed environment.

## Example

```typescript
import { defineEnv } from "@cfast/env";

const env = defineEnv({
  DB: { type: "d1" },
  CACHE: { type: "kv" },
  MAILGUN_API_KEY: { type: "secret" },
  APP_URL: { type: "var", default: "http://localhost:8787" },
});

export default {
  async fetch(request, rawEnv) {
    env.init(rawEnv);
    const { DB, MAILGUN_API_KEY } = env.get();
  },
};
```
