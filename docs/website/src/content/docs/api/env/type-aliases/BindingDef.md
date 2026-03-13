---
editUrl: false
next: false
prev: false
title: "BindingDef"
---

> **BindingDef** = [`VarBindingDef`](/api/env/type-aliases/varbindingdef/) \| [`ObjectBindingDef`](/api/env/type-aliases/objectbindingdef/) \| [`SecretBindingDef`](/api/env/type-aliases/secretbindingdef/)

Defined in: [packages/env/src/types.ts:136](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/types.ts#L136)

Discriminated union of all binding definition types.

Discriminated on the `type` field: `"var"` resolves to [VarBindingDef](/api/env/type-aliases/varbindingdef/),
`"secret"` to [SecretBindingDef](/api/env/type-aliases/secretbindingdef/), and all other binding types to [ObjectBindingDef](/api/env/type-aliases/objectbindingdef/).
