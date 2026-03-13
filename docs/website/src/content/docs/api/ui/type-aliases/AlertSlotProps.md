---
editUrl: false
next: false
prev: false
title: "AlertSlotProps"
---

> **AlertSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:320](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L320)

Props for the alert plugin slot.

Renders inline feedback messages for success, error, and warning states.
Used by [FormStatusProps](/api/ui/type-aliases/formstatusprops/) to display action result feedback.

## See

[UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:322](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L322)

Alert message content.

***

### color?

> `optional` **color**: `"success"` \| `"danger"` \| `"warning"` \| `"neutral"`

Defined in: [packages/ui/src/types.ts:324](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L324)

Semantic color indicating the alert type.

***

### variant?

> `optional` **variant**: `"soft"` \| `"solid"` \| `"outlined"`

Defined in: [packages/ui/src/types.ts:326](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L326)

Visual style variant.
