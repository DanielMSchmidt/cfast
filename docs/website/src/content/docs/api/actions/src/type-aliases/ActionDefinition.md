---
editUrl: false
next: false
prev: false
title: "ActionDefinition"
---

> **ActionDefinition**\<`TInput`, `TResult`, `TUser`\> = `object`

Defined in: [packages/actions/src/types.ts:73](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L73)

## Type Parameters

### TInput

`TInput`

### TResult

`TResult`

### TUser

`TUser`

## Properties

### action()

> **action**: (`args`) => `Promise`\<`TResult`\>

Defined in: [packages/actions/src/types.ts:74](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L74)

#### Parameters

##### args

[`RequestArgs`](/api/actions/src/type-aliases/requestargs/)

#### Returns

`Promise`\<`TResult`\>

***

### buildOperation()

> **buildOperation**: (`db`, `input`, `ctx`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L79)

#### Parameters

##### db

[`Db`](/api/db/src/type-aliases/db/)

##### input

`TInput`

##### ctx

[`ActionContext`](/api/actions/src/type-aliases/actioncontext/)\<`TUser`\>

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

***

### client

> **client**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/actions/src/types.ts:78](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L78)

***

### loader()

> **loader**: \<`TLoaderData`\>(`loaderFn`) => (`args`) => `Promise`\<`TLoaderData` & `object`\>

Defined in: [packages/actions/src/types.ts:75](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L75)

#### Type Parameters

##### TLoaderData

`TLoaderData` *extends* `Record`\<`string`, [`Serializable`](/api/actions/src/type-aliases/serializable/)\>

#### Parameters

##### loaderFn

(`args`) => `Promise`\<`TLoaderData`\>

#### Returns

> (`args`): `Promise`\<`TLoaderData` & `object`\>

##### Parameters

###### args

[`RequestArgs`](/api/actions/src/type-aliases/requestargs/)

##### Returns

`Promise`\<`TLoaderData` & `object`\>
