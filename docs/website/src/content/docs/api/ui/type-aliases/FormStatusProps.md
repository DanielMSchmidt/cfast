---
editUrl: false
next: false
prev: false
title: "FormStatusProps"
---

> **FormStatusProps** = `object`

Defined in: [packages/ui/src/types.ts:1087](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1087)

Props for the FormStatus component.

Displays action result feedback in a consistent format: success messages as
green alerts, error messages as red alerts, and field validation errors as a
keyed list. Uses the [AlertSlotProps](/api/ui/type-aliases/alertslotprops/) slot internally.

## See

[FormStatusData](/api/ui/type-aliases/formstatusdata/) for the expected data structure.

## Properties

### data

> **data**: [`FormStatusData`](/api/ui/type-aliases/formstatusdata/) \| `null` \| `undefined`

Defined in: [packages/ui/src/types.ts:1089](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1089)

Action result data, or null/undefined when no result is available.
