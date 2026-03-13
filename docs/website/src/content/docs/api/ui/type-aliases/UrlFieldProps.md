---
editUrl: false
next: false
prev: false
title: "UrlFieldProps"
---

> **UrlFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:763](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L763)

Props for the UrlField read-only display component.

Renders a URL as an external link with an indicator icon. Optionally truncates
the display to hostname + path for readability.

## Type Declaration

### truncate?

> `optional` **truncate**: `boolean`

Whether to truncate the URL to hostname + path.

### value

> **value**: `string` \| `null` \| `undefined`

URL to display as an external link.

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
