---
editUrl: false
next: false
prev: false
title: "ChipSlotProps"
---

> **ChipSlotProps** = `object`

Defined in: [packages/ui/src/types.ts:218](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L218)

Props for the chip/badge plugin slot.

Used for status indicators, role badges ([RoleBadgeProps](/api/ui/type-aliases/rolebadgeprops/)), and
boolean field display ([BooleanFieldProps](/api/ui/type-aliases/booleanfieldprops/)).

## See

[UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the slot registration point.

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:220](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L220)

Chip label content.

***

### color?

> `optional` **color**: `"primary"` \| `"neutral"` \| `"danger"` \| `"success"` \| `"warning"`

Defined in: [packages/ui/src/types.ts:222](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L222)

Color theme.

***

### size?

> `optional` **size**: `"sm"` \| `"md"` \| `"lg"`

Defined in: [packages/ui/src/types.ts:226](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L226)

Size of the chip.

***

### variant?

> `optional` **variant**: `"solid"` \| `"soft"` \| `"outlined"`

Defined in: [packages/ui/src/types.ts:224](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L224)

Visual style variant.
