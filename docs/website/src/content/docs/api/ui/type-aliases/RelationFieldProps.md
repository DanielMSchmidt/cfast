---
editUrl: false
next: false
prev: false
title: "RelationFieldProps"
---

> **RelationFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:822](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L822)

Props for the RelationField read-only display component.

Displays a related record's display field (e.g., author name) with an optional
link to the related record's detail page. The `linkTo` pattern supports `:id`
as a placeholder for the record's ID.

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

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
