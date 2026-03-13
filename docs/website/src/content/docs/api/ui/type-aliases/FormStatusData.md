---
editUrl: false
next: false
prev: false
title: "FormStatusData"
---

> **FormStatusData** = `object`

Defined in: [packages/ui/src/types.ts:1069](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1069)

Data structure for action result feedback (success, error, field errors).

Typically returned from React Router actions and passed to [FormStatusProps](/api/ui/type-aliases/formstatusprops/).
Supports both top-level messages and per-field validation errors from `@cfast/forms`.

## See

[FormStatusProps](/api/ui/type-aliases/formstatusprops/) for the component that renders this data.

## Properties

### error?

> `optional` **error**: `string`

Defined in: [packages/ui/src/types.ts:1073](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1073)

Error message to display.

***

### fieldErrors?

> `optional` **fieldErrors**: `Record`\<`string`, `string`[]\>

Defined in: [packages/ui/src/types.ts:1075](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1075)

Per-field validation error messages.

***

### success?

> `optional` **success**: `string`

Defined in: [packages/ui/src/types.ts:1071](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1071)

Success message to display.
