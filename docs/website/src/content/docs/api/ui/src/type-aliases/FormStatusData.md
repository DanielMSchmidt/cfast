---
editUrl: false
next: false
prev: false
title: "FormStatusData"
---

> **FormStatusData** = `object`

Defined in: [packages/ui/src/types.ts:686](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L686)

Data structure for action result feedback (success, error, field errors).

## Properties

### error?

> `optional` **error**: `string`

Defined in: [packages/ui/src/types.ts:690](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L690)

Error message to display.

***

### fieldErrors?

> `optional` **fieldErrors**: `Record`\<`string`, `string`[]\>

Defined in: [packages/ui/src/types.ts:692](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L692)

Per-field validation error messages.

***

### success?

> `optional` **success**: `string`

Defined in: [packages/ui/src/types.ts:688](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L688)

Success message to display.
