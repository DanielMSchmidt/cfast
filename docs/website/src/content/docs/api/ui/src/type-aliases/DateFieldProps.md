---
editUrl: false
next: false
prev: false
title: "DateFieldProps"
---

> **DateFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:447](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L447)

Props for the DateField read-only display component.

## Type Declaration

### format?

> `optional` **format**: `"short"` \| `"long"` \| `"relative"` \| `"datetime"`

Display format. Defaults to "short".

### locale?

> `optional` **locale**: `string`

Locale for date formatting. Defaults to "en".

### value

> **value**: `Date` \| `string` \| `number` \| `null` \| `undefined`

Date value to display. Accepts Date objects, ISO strings, or timestamps.
