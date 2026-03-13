---
editUrl: false
next: false
prev: false
title: "AppContext"
---

> **AppContext**\<`TSchema`, `TPluginContext`\> = `object` & `TPluginContext`

Defined in: [packages/core/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/core/src/types.ts#L89)

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
