---
editUrl: false
next: false
prev: false
title: "CreateAppConfig"
---

> **CreateAppConfig**\<`TSchema`, `TPermissions`\> = `object`

Defined in: [packages/core/src/types.ts:11](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/types.ts#L11)

Configuration object for [createApp](/api/core/functions/createapp/).

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/type-aliases/schema/)

The env schema type from `@cfast/env`.

### TPermissions

`TPermissions` *extends* [`Permissions`](/api/permissions/type-aliases/permissions/)

The permissions definition from `@cfast/permissions`.

## Properties

### env

> **env**: `TSchema`

Defined in: [packages/core/src/types.ts:16](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/types.ts#L16)

The environment variable schema. Validated at `app.init()` time via `@cfast/env`.

***

### permissions

> **permissions**: `TPermissions`

Defined in: [packages/core/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/types.ts#L18)

The permissions config from `definePermissions()`. Made available to all plugins.
