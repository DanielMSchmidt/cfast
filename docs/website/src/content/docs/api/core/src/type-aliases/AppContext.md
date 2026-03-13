---
editUrl: false
next: false
prev: false
title: "AppContext"
---

> **AppContext**\<`TSchema`, `TPluginContext`\> = `object` & `TPluginContext`

Defined in: [packages/core/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L89)

The accumulated per-request context after all plugins have run.

Contains the validated env plus each plugin's namespaced values.

## Type Declaration

### env

> **env**: [`ParsedEnv`](/api/env/src/type-aliases/parsedenv/)\<`TSchema`\>

The validated environment bindings.

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/src/type-aliases/schema/)

The env schema type.

### TPluginContext

`TPluginContext`

The intersection of all registered plugins' provides.
