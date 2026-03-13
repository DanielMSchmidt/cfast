---
editUrl: false
next: false
prev: false
title: "EmptyState"
---

> **EmptyState**(`__namedParameters`): `Element`

Defined in: [packages/ui/src/components/empty-state.tsx:13](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/components/empty-state.tsx#L13)

Permission-aware empty state.

- If createAction is permitted: shows title + description + CTA button
- If createAction is forbidden: shows title + description only
- If createAction is invisible: shows generic message
- If no createAction: shows title + description

## Parameters

### \_\_namedParameters

[`EmptyStateProps`](/api/ui/src/type-aliases/emptystateprops/)

## Returns

`Element`
