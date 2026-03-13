---
editUrl: false
next: false
prev: false
title: "FormPlugin"
---

> **FormPlugin** = `object`

Defined in: [packages/forms/src/types.ts:187](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L187)

A form plugin created by [createFormPlugin](/api/forms/functions/createformplugin/).

Encapsulates the UI component implementations needed to render auto-generated forms.
Pass this to [createAutoForm](/api/forms/functions/createautoform/) to produce a ready-to-use `AutoForm` component.

## Properties

### components

> **components**: [`FormPluginComponents`](/api/forms/type-aliases/formplugincomponents/)

Defined in: [packages/forms/src/types.ts:189](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L189)

The UI components used to render each field type and the form structure.
