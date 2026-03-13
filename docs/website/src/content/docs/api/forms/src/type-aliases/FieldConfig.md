---
editUrl: false
next: false
prev: false
title: "FieldConfig"
---

> **FieldConfig** = `object`

Defined in: [packages/forms/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L30)

Per-field overrides for customizing auto-generated form fields.

## Properties

### component?

> `optional` **component**: `React.ComponentType`\<[`FieldComponentProps`](/api/forms/src/type-aliases/fieldcomponentprops/)\>

Defined in: [packages/forms/src/types.ts:35](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L35)

***

### default?

> `optional` **default**: `unknown`

Defined in: [packages/forms/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L34)

***

### hidden?

> `optional` **hidden**: `boolean`

Defined in: [packages/forms/src/types.ts:33](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L33)

***

### label?

> `optional` **label**: `string`

Defined in: [packages/forms/src/types.ts:31](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L31)

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [packages/forms/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L32)

***

### validate()?

> `optional` **validate**: (`value`) => `string` \| `undefined`

Defined in: [packages/forms/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/forms/src/types.ts#L36)

#### Parameters

##### value

`unknown`

#### Returns

`string` \| `undefined`
