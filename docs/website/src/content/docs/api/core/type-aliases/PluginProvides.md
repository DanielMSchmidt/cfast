---
editUrl: false
next: false
prev: false
title: "PluginProvides"
---

> **PluginProvides**\<`T`\> = `T` *extends* [`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<infer N, infer P, `unknown`, `unknown`\> ? `{ [K in N]: P }` : `never`

Defined in: [packages/core/src/types.ts:72](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L72)

Utility type that extracts `{ [name]: ReturnType<setup> }` from a plugin definition.

Use this to create a type token that dependent plugins can reference via `definePlugin<TRequires>()`.

## Type Parameters

### T

`T`

A `CfastPlugin` type to extract provides from.
