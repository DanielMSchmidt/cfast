---
editUrl: false
next: false
prev: false
title: "ToastApi"
---

> **ToastApi** = `object`

Defined in: [packages/ui/src/types.ts:889](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L889)

Imperative API returned by `useToast()` for showing notifications.

Provides a `show()` method for full control and convenience methods for each
[ToastType](/api/ui/type-aliases/toasttype/). Also used internally by `useActionToast()` to auto-display
notifications when `@cfast/actions` operations complete.

## See

 - [ToastOptions](/api/ui/type-aliases/toastoptions/) for the full options object.
 - [ToastSlotProps](/api/ui/type-aliases/toastslotprops/) for the provider slot that enables toast rendering.

## Properties

### error()

> **error**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:895](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L895)

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

Defined in: [packages/ui/src/types.ts:897](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L897)

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

Defined in: [packages/ui/src/types.ts:891](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L891)

Show a toast with full options control.

#### Parameters

##### options

[`ToastOptions`](/api/ui/type-aliases/toastoptions/)

#### Returns

`void`

***

### success()

> **success**: (`message`, `description?`) => `void`

Defined in: [packages/ui/src/types.ts:893](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L893)

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

Defined in: [packages/ui/src/types.ts:899](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L899)

Show a warning toast.

#### Parameters

##### message

`string`

##### description?

`string`

#### Returns

`void`
