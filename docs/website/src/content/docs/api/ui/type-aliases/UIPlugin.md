---
editUrl: false
next: false
prev: false
title: "UIPlugin"
---

> **UIPlugin** = `object`

Defined in: [packages/ui/src/types.ts:68](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L68)

A UI plugin providing styled component implementations for plugin slots.

Created via `createUIPlugin()`. Slots not provided fall back to the headless
defaults (unstyled HTML elements). The Joy UI plugin (`@cfast/ui/joy`) is the
built-in implementation; third-party plugins can target shadcn, Mantine, or
any other component library.

## See

[UIPluginComponents](/api/ui/type-aliases/uiplugincomponents/) for the full list of available slots.

## Properties

### components

> **components**: `Partial`\<[`UIPluginComponents`](/api/ui/type-aliases/uiplugincomponents/)\>

Defined in: [packages/ui/src/types.ts:70](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L70)

Partial map of slot names to component implementations.
