---
editUrl: false
next: false
prev: false
title: "createActions"
---

> **createActions**\<`TUser`\>(`config`): `object`

Defined in: [packages/actions/src/create-actions.ts:59](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/create-actions.ts#L59)

## Type Parameters

### TUser

`TUser` = `any`

## Parameters

### config

[`ActionsConfig`](/api/actions/src/type-aliases/actionsconfig/)\<`TUser`\>

## Returns

`object`

### composeActions()

> **composeActions**: \<`TActions`\>(`actions`) => [`ComposedActions`](/api/actions/src/type-aliases/composedactions/)\<`TActions`\>

#### Type Parameters

##### TActions

`TActions` *extends* `Record`\<`string`, [`ActionDefinition`](/api/actions/src/type-aliases/actiondefinition/)\<`any`, `any`, `any`\>\>

#### Parameters

##### actions

`TActions`

#### Returns

[`ComposedActions`](/api/actions/src/type-aliases/composedactions/)\<`TActions`\>

### createAction()

> **createAction**: \<`TInput`, `TResult`\>(`operationsFn`) => [`ActionDefinition`](/api/actions/src/type-aliases/actiondefinition/)\<`TInput`, `TResult`, `TUser`\>

#### Type Parameters

##### TInput

`TInput`

##### TResult

`TResult`

#### Parameters

##### operationsFn

[`OperationsFn`](/api/actions/src/type-aliases/operationsfn/)\<`TInput`, `TResult`, `TUser`\>

#### Returns

[`ActionDefinition`](/api/actions/src/type-aliases/actiondefinition/)\<`TInput`, `TResult`, `TUser`\>
