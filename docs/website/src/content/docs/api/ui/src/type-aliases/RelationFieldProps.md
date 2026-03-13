---
editUrl: false
next: false
prev: false
title: "RelationFieldProps"
---

> **RelationFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:533](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L533)

Props for the RelationField read-only display component.

## Type Declaration

### display?

> `optional` **display**: `string`

Property name to display from the related record. Defaults to "name".

### linkTo?

> `optional` **linkTo**: `string`

URL pattern for linking to the related record. Use `:id` as placeholder.

### value

> **value**: `unknown`

Related record object or primitive value.
