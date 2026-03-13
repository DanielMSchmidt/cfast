---
editUrl: false
next: false
prev: false
title: "NumberFieldProps"
---

> **NumberFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:471](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L471)

Props for the NumberField read-only display component.

## Type Declaration

### currency?

> `optional` **currency**: `string`

ISO 4217 currency code for monetary formatting (e.g. "USD").

### decimals?

> `optional` **decimals**: `number`

Number of decimal places to display.

### locale?

> `optional` **locale**: `string`

Locale for number formatting. Defaults to "en".

### value

> **value**: `number` \| `null` \| `undefined`

Numeric value to display.
