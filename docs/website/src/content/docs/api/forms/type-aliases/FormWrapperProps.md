---
editUrl: false
next: false
prev: false
title: "FormWrapperProps"
---

> **FormWrapperProps** = `object`

Defined in: [packages/forms/src/types.ts:164](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L164)

Props for the form wrapper component provided by a [FormPlugin](/api/forms/type-aliases/formplugin/).

The wrapper is responsible for rendering the `<form>` element and wiring up submission.

## Properties

### children

> **children**: `React.ReactNode`

Defined in: [packages/forms/src/types.ts:168](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L168)

The rendered field components and submit button.

***

### onSubmit()

> **onSubmit**: (`e`) => `void`

Defined in: [packages/forms/src/types.ts:166](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/forms/src/types.ts#L166)

Form submission handler, typically bound to react-hook-form's `handleSubmit`.

#### Parameters

##### e

`React.FormEvent`

#### Returns

`void`
