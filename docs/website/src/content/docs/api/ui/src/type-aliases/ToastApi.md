---
editUrl: false
next: false
prev: false
title: "ToastApi"
---

> **ToastApi** = `object`

Defined in: [packages/ui/src/types.ts:568](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L568)

Imperative API returned by `useToast()` for showing notifications.

## Properties

### error()

> **error**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:574](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L574)

Show an error toast.

#### Parameters

##### message

`string`

##### description?

`string`

#### Returns

`void`

***

### info()

> **info**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:576](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L576)

Show an informational toast.

#### Parameters

##### message

`string`

##### description?

`string`

#### Returns

`void`

***

### show()

> **show**: (`options`) => `void`

Defined in: [packages/ui/src/types.ts:570](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L570)

Show a toast with full options control.

#### Parameters

##### options

[`ToastOptions`](/api/ui/src/type-aliases/toastoptions/)

#### Returns

`void`

***

### success()

> **success**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:572](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L572)

Show a success toast.

#### Parameters

##### message

`string`

##### description?

`string`

#### Returns

`void`

***

### warning()

> **warning**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:578](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L578)

Show a warning toast.

#### Parameters

##### message

`string`

##### description?

`string`

#### Returns

`void`
