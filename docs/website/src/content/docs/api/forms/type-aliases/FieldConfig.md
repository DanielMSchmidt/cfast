---
editUrl: false
next: false
prev: false
title: "FieldConfig"
---

> **FieldConfig** = `object`

Defined in: [packages/forms/src/types.ts:88](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L88)

Per-field overrides for customizing auto-generated form fields.

Pass a record of `{ [columnName]: FieldConfig }` to the AutoForm `fields` prop
to override labels, placeholders, visibility, defaults, components, or validation
for individual fields.

## Example

```tsx
<AutoForm
  table={posts}
  mode="create"
  fields={{
    title: { label: "Post Title", placeholder: "Enter a title..." },
    content: { component: RichTextEditor },
    authorId: { hidden: true, default: currentUser.id },
  }}
  onSubmit={handleSubmit}
/>
```

## Properties

### component?

> `optional` **component**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:98](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L98)

Custom React component to render instead of the plugin's default for this input type.

***

### default?

> `optional` **default**: `unknown`

Defined in: [packages/forms/src/types.ts:96](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L96)

Default value for the field in create mode.

***

### hidden?

> `optional` **hidden**: `boolean`

Defined in: [packages/forms/src/types.ts:94](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L94)

Hide this field from the rendered form. The field is still submitted if a default is set.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/forms/src/types.ts:90](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L90)

Override the auto-generated label for this field.

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [packages/forms/src/types.ts:92](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L92)

Placeholder text shown inside the input.

***

### validate()?

> `optional` **validate**: (`value`) => `string` \| `undefined`

Defined in: [packages/forms/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/forms/src/types.ts#L100)

Custom validation function. Return an error message string to fail, or `undefined` to pass.

#### Parameters

##### value

`unknown`

#### Returns

`string` \| `undefined`
