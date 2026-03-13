---
editUrl: false
next: false
prev: false
title: "FormPlugin"
---

> **FormPlugin** = `object`

Defined in: [packages/forms/src/types.ts:187](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L187)

A form plugin created by [createFormPlugin](/api/forms/functions/createformplugin/).

Encapsulates the UI component implementations needed to render auto-generated forms.
Pass this to [createAutoForm](/api/forms/functions/createautoform/) to produce a ready-to-use `AutoForm` component.

## Properties

### components

> **components**: [`FormPluginComponents`](/api/forms/type-aliases/formplugincomponents/)

Defined in: [packages/forms/src/types.ts:189](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L189)

The UI components used to render each field type and the form structure.
