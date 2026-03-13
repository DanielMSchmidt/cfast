---
editUrl: false
next: false
prev: false
title: "BindingType"
---

> **BindingType** = keyof [`BindingTypeMap`](/api/env/type-aliases/bindingtypemap/)

Defined in: [packages/env/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L39)

Union of all supported Cloudflare binding type strings.

Includes object bindings (`"d1"`, `"kv"`, `"r2"`, `"queue"`, `"durable-object"`, `"service"`),
string bindings (`"secret"`, `"var"`).
