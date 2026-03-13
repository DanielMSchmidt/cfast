---
editUrl: false
next: false
prev: false
title: "AppContext"
---

> **AppContext**\<`TSchema`, `TPluginContext`\> = `object` & `TPluginContext`

Defined in: [packages/core/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/core/src/types.ts#L89)

The accumulated per-request context after all plugins have run.

Contains the validated env plus each plugin's namespaced values.

## Type Declaration

### env

> **env**: [`ParsedEnv`](/api/env/type-aliases/parsedenv/)\<`TSchema`\>

The validated environment bindings.

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/type-aliases/schema/)

The env schema type.

### TPluginContext

`TPluginContext`

The intersection of all registered plugins' provides.
