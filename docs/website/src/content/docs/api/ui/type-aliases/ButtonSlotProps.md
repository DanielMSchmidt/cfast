---
editUrl: false
next: false
prev: false
title: "ButtonSlotProps"
---

> **ButtonSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:83](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L83)

Props for the button plugin slot.

Implemented by the UI plugin to render interactive buttons throughout the framework.
Used internally by [ActionButtonProps](/api/ui/type-aliases/actionbuttonprops/) and other interactive components.

## See

[UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L85)

Button content.

***

### color?

> `optional` **color**: `"primary"` \| `"neutral"` \| `"danger"` \| `"success"` \| `"warning"`

Defined in: [packages/ui/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L95)

Color theme.

***

### disabled?

> `optional` **disabled**: `boolean`

Defined in: [packages/ui/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L89)

Whether the button is disabled.

***

### loading?

> `optional` **loading**: `boolean`

Defined in: [packages/ui/src/types.ts:91](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L91)

Whether the button is in a loading state.

***

### onClick()?

> `optional` **onClick**: () => `void`

Defined in: [packages/ui/src/types.ts:87](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L87)

Click handler.

#### Returns

`void`

***

### size?

> `optional` **size**: `"sm"` \| `"md"` \| `"lg"`

Defined in: [packages/ui/src/types.ts:97](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L97)

Size of the button.

***

### startDecorator?

> `optional` **startDecorator**: `ReactNode`

Defined in: [packages/ui/src/types.ts:101](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L101)

Element rendered before the button label.

***

### type?

> `optional` **type**: `"button"` \| `"submit"`

Defined in: [packages/ui/src/types.ts:99](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L99)

HTML button type attribute.

***

### variant?

> `optional` **variant**: `"solid"` \| `"soft"` \| `"outlined"` \| `"plain"`

Defined in: [packages/ui/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L93)

Visual style variant.
