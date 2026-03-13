---
editUrl: false
next: false
prev: false
title: "NavigationProgressProps"
---

> **NavigationProgressProps** = `object`

Defined in: [packages/ui/src/types.ts:1348](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1348)

Props for the NavigationProgress component.

Thin progress bar rendered at the top of the page during React Router navigation
transitions. Uses `useNavigation().state` to show on `"loading"` and hide on `"idle"`.
Typically placed in the root layout; no configuration is required beyond optional color.

## Properties

### color?

> `optional` **color**: `string`

Defined in: [packages/ui/src/types.ts:1350](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1350)

Progress bar color. Defaults to "#1976d2".
