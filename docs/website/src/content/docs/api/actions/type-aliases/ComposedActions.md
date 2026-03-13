---
editUrl: false
next: false
prev: false
title: "ComposedActions"
---

> **ComposedActions**\<`TActions`\> = `object`

Defined in: [packages/actions/src/types.ts:220](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L220)

The result of combining multiple [action definitions](/api/actions/type-aliases/actiondefinition/)
via `composeActions()`.

Provides a single action handler that dispatches by the `_action` discriminator,
a loader wrapper that checks permissions for all actions at once, a client
descriptor covering all action names, and the original action map.

## Example

```ts
const composed = composeActions({
  deletePost,
  publishPost,
  unpublishPost,
});

export const action = composed.action;
export const loader = composed.loader(myLoader);
```

## Type Parameters

### TActions

`TActions` *extends* `Record`\<`string`, [`ActionDefinition`](/api/actions/type-aliases/actiondefinition/)\<`any`, `any`, `any`\>\>

A record mapping action names to their [ActionDefinition](/api/actions/type-aliases/actiondefinition/) types.

## Properties

### action()

> **action**: (`args`) => `Promise`\<`unknown`\>

Defined in: [packages/actions/src/types.ts:222](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L222)

Combined action handler that dispatches to the correct action based on `_action` field.

#### Parameters

##### args

[`RequestArgs`](/api/actions/type-aliases/requestargs/)

#### Returns

`Promise`\<`unknown`\>

***

### actions

> **actions**: `TActions`

Defined in: [packages/actions/src/types.ts:235](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L235)

The original action definitions, keyed by name.

***

### client

> **client**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/actions/src/types.ts:233](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L233)

Opaque descriptor covering all composed action names, for the `useActions` client hook.

***

### loader()

> **loader**: \<`TLoaderData`\>(`loaderFn`) => (`args`) => `Promise`\<`TLoaderData` & `object`\>

Defined in: [packages/actions/src/types.ts:229](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L229)

Wraps a loader function to inject [ActionPermissionsMap](/api/actions/type-aliases/actionpermissionsmap/) for all composed actions.

Checks permissions for every action in the map and merges the results
into loader data under `_actionPermissions`.

#### Type Parameters

##### TLoaderData

`TLoaderData` *extends* `Record`\<`string`, [`Serializable`](/api/actions/type-aliases/serializable/)\>

#### Parameters

##### loaderFn

(`args`) => `Promise`\<`TLoaderData`\>

#### Returns

> (`args`): `Promise`\<`TLoaderData` & `object`\>

##### Parameters

###### args

[`RequestArgs`](/api/actions/type-aliases/requestargs/)

##### Returns

`Promise`\<`TLoaderData` & `object`\>
