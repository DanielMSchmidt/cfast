---
editUrl: false
next: false
prev: false
title: "PluginSetupContext"
---

> **PluginSetupContext**\<`TRequires`\> = `object` & `TRequires`

Defined in: [packages/core/src/types.ts:29](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/types.ts#L29)

The context object passed to a plugin's `setup()` function.

Contains the current request, validated env, and all values provided by prior plugins
(typed via `TRequires`).

## Type Declaration

### env

> **env**: `Record`\<`string`, `unknown`\>

The validated environment bindings.

### request

> **request**: `Request`

The incoming HTTP request for the current invocation.

## Type Parameters

### TRequires

`TRequires`

Intersection of prior plugin provides (e.g., `AuthPluginProvides`).
