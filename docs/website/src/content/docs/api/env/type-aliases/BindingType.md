---
editUrl: false
next: false
prev: false
title: "BindingType"
---

> **BindingType** = keyof [`BindingTypeMap`](/api/env/type-aliases/bindingtypemap/)

Defined in: [packages/env/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/types.ts#L39)

Union of all supported Cloudflare binding type strings.

Includes object bindings (`"d1"`, `"kv"`, `"r2"`, `"queue"`, `"durable-object"`, `"service"`),
string bindings (`"secret"`, `"var"`).
