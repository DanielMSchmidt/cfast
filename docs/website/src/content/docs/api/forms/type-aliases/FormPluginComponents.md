---
editUrl: false
next: false
prev: false
title: "FormPluginComponents"
---

> **FormPluginComponents** = `object`

Defined in: [packages/forms/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L144)

The set of UI components a [FormPlugin](/api/forms/type-aliases/formplugin/) must provide.

Each component handles rendering a specific input type. The `form` and `submitButton`
components wrap the overall form structure.

## Example

```ts
const components: FormPluginComponents = {
  textInput: MyTextInput,
  numberInput: MyNumberInput,
  select: MySelect,
  checkbox: MyCheckbox,
  form: MyFormWrapper,
  submitButton: MySubmitButton,
};
```

## Properties

### checkbox

> **checkbox**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:152](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L152)

Component for rendering boolean column inputs as a checkbox.

***

### form

> **form**: `React.ComponentType`\<[`FormWrapperProps`](/api/forms/type-aliases/formwrapperprops/)\>

Defined in: [packages/forms/src/types.ts:154](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L154)

Wrapper component for the entire form element. Receives `onSubmit` and children.

***

### numberInput

> **numberInput**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:148](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L148)

Component for rendering integer/number column inputs.

***

### select

> **select**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:150](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L150)

Component for rendering enum column inputs as a dropdown select.

***

### submitButton

> **submitButton**: `React.ComponentType`\<[`SubmitButtonProps`](/api/forms/type-aliases/submitbuttonprops/)\>

Defined in: [packages/forms/src/types.ts:156](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L156)

Component for the form's submit button. Receives loading state and label.

***

### textInput

> **textInput**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:146](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L146)

Component for rendering text/varchar column inputs.
