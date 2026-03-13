---
editUrl: false
next: false
prev: false
title: "NumberFieldProps"
---

> **NumberFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:471](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L471)

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
