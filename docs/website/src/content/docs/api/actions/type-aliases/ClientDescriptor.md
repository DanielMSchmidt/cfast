---
editUrl: false
next: false
prev: false
title: "ClientDescriptor"
---

> **ClientDescriptor** = `object`

Defined in: [packages/actions/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L142)

An opaque descriptor passed to the client to configure the `useActions` hook.

Created by [ActionDefinition.client](/api/actions/type-aliases/actiondefinition/#client) or [ComposedActions.client](/api/actions/type-aliases/composedactions/#client).
Contains the action names and the key used to read permission data from loader results.

## Properties

### \_brand

> **\_brand**: `"ActionClientDescriptor"`

Defined in: [packages/actions/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L144)

Brand field to distinguish this type at the type level.

***

### actionNames

> **actionNames**: readonly `string`[]

Defined in: [packages/actions/src/types.ts:146](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L146)

The list of action names this descriptor covers.

***

### permissionsKey

> **permissionsKey**: `string`

Defined in: [packages/actions/src/types.ts:148](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L148)

The loader-data key where [ActionPermissionsMap](/api/actions/type-aliases/actionpermissionsmap/) is stored.
