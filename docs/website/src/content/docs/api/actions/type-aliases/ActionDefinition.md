---
editUrl: false
next: false
prev: false
title: "ActionDefinition"
---

> **ActionDefinition**\<`TInput`, `TResult`, `TUser`\> = `object`

Defined in: [packages/actions/src/types.ts:178](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L178)

A single action definition returned by `createAction()`.

Provides four facets: a React Router action handler, a loader wrapper
that injects permission status, a client descriptor for `useActions`,
and a `buildOperation` method for advanced composition.

## Example

```ts
const deletePost = createAction<{ postId: string }, Response>(
  (db, input, ctx) =>
    compose(
      [db.delete(posts).where(eq(posts.id, input.postId))],
      async (runDelete) => { await runDelete({}); return redirect("/"); },
    ),
);

// Use as a route action
export const action = deletePost.action;
// Wrap a loader to inject permissions
export const loader = deletePost.loader(myLoader);
```

## Type Parameters

### TInput

`TInput`

The expected input shape for this action.

### TResult

`TResult`

The return type of the action handler.

### TUser

`TUser`

The shape of the authenticated user object.

## Properties

### action()

> **action**: (`args`) => `Promise`\<`TResult`\>

Defined in: [packages/actions/src/types.ts:180](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L180)

React Router action handler. Parses input, resolves context, and runs the operation.

#### Parameters

##### args

[`RequestArgs`](/api/actions/type-aliases/requestargs/)

#### Returns

`Promise`\<`TResult`\>

***

### buildOperation()

> **buildOperation**: (`db`, `input`, `ctx`) => [`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:194](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L194)

Builds the raw [Operation](/api/db/type-aliases/operation/) for this action, useful for cross-action composition.

#### Parameters

##### db

[`Db`](/api/db/type-aliases/db/)

##### input

`TInput`

##### ctx

[`ActionContext`](/api/actions/type-aliases/actioncontext/)\<`TUser`\>

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

***

### client

> **client**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/actions/src/types.ts:192](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L192)

Opaque descriptor for the `useActions` client hook.

***

### loader()

> **loader**: \<`TLoaderData`\>(`loaderFn`) => (`args`) => `Promise`\<`TLoaderData` & `object`\>

Defined in: [packages/actions/src/types.ts:188](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L188)

Wraps a loader function to inject [ActionPermissionsMap](/api/actions/type-aliases/actionpermissionsmap/) into its return value.

The wrapper resolves the action context, builds the operation to extract
permission descriptors, checks them against the user's grants, and merges
the result as `_actionPermissions`.

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
