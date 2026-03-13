---
editUrl: false
next: false
prev: false
title: "FormWrapperProps"
---

> **FormWrapperProps** = `object`

Defined in: [packages/forms/src/types.ts:164](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L164)

Props for the form wrapper component provided by a [FormPlugin](/api/forms/type-aliases/formplugin/).

The wrapper is responsible for rendering the `<form>` element and wiring up submission.

## Properties

### children

> **children**: `React.ReactNode`

Defined in: [packages/forms/src/types.ts:168](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L168)

The rendered field components and submit button.

***

### onSubmit()

> **onSubmit**: (`e`) => `void`

Defined in: [packages/forms/src/types.ts:166](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L166)

Form submission handler, typically bound to react-hook-form's `handleSubmit`.

#### Parameters

##### e

`React.FormEvent`

#### Returns

`void`
