---
editUrl: false
next: false
prev: false
title: "DateFieldProps"
---

> **DateFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:675](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L675)

Props for the DateField read-only display component.

Formats dates using `Intl.DateTimeFormat` with support for relative time display.
Used by [DataTableProps](/api/ui/type-aliases/datatableprops/) cell renderers for date/timestamp columns.

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

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
