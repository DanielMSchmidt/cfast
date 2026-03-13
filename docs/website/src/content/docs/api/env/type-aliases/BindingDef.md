---
editUrl: false
next: false
prev: false
title: "BindingDef"
---

> **BindingDef** = [`VarBindingDef`](/api/env/type-aliases/varbindingdef/) \| [`ObjectBindingDef`](/api/env/type-aliases/objectbindingdef/) \| [`SecretBindingDef`](/api/env/type-aliases/secretbindingdef/)

Defined in: [packages/env/src/types.ts:136](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L136)

Discriminated union of all binding definition types.

Discriminated on the `type` field: `"var"` resolves to [VarBindingDef](/api/env/type-aliases/varbindingdef/),
`"secret"` to [SecretBindingDef](/api/env/type-aliases/secretbindingdef/), and all other binding types to [ObjectBindingDef](/api/env/type-aliases/objectbindingdef/).
