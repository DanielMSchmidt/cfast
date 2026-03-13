---
editUrl: false
next: false
prev: false
title: "CreateAppConfig"
---

> **CreateAppConfig**\<`TSchema`, `TPermissions`\> = `object`

Defined in: [packages/core/src/types.ts:11](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L11)

Configuration object for [createApp](/api/core/src/functions/createapp/).

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/src/type-aliases/schema/)

The env schema type from `@cfast/env`.

### TPermissions

`TPermissions` *extends* [`Permissions`](/api/permissions/src/type-aliases/permissions/)

The permissions definition from `@cfast/permissions`.

## Properties

### env

> **env**: `TSchema`

Defined in: [packages/core/src/types.ts:16](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L16)

The environment variable schema. Validated at `app.init()` time via `@cfast/env`.

***

### permissions

> **permissions**: `TPermissions`

Defined in: [packages/core/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L18)

The permissions config from `definePermissions()`. Made available to all plugins.
