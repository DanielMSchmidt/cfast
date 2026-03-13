---
editUrl: false
next: false
prev: false
title: "ComposedActions"
---

> **ComposedActions**\<`TActions`\> = `object`

Defined in: [packages/actions/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L85)

## Type Parameters

### TActions

`TActions` *extends* `Record`\<`string`, [`ActionDefinition`](/api/actions/src/type-aliases/actiondefinition/)\<`any`, `any`, `any`\>\>

## Properties

### action()

> **action**: (`args`) => `Promise`\<`unknown`\>

Defined in: [packages/actions/src/types.ts:86](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L86)

#### Parameters

##### args

[`RequestArgs`](/api/actions/src/type-aliases/requestargs/)

#### Returns

`Promise`\<`unknown`\>

***

### actions

> **actions**: `TActions`

Defined in: [packages/actions/src/types.ts:91](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L91)

***

### client

> **client**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/actions/src/types.ts:90](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L90)

***

### loader()

> **loader**: \<`TLoaderData`\>(`loaderFn`) => (`args`) => `Promise`\<`TLoaderData` & `object`\>

Defined in: [packages/actions/src/types.ts:87](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L87)

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
