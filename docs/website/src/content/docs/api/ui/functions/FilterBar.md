---
editUrl: false
next: false
prev: false
title: "FilterBar"
---

> **FilterBar**(`props`): `Element`

Defined in: [packages/ui/src/components/filter-bar.tsx:32](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/filter-bar.tsx#L32)

URL-synced filter controls for data tables and list views.

Each filter serializes its state to URL search params (e.g., `?published=true`).
On filter change, React Router navigates with the updated params, resetting
pagination to page 1. In the loader, `@cfast/pagination`'s `parseParams()`
reads these params and applies them as Drizzle `where` clauses.

Supports text, select, boolean, and other filter types via [FilterDef](/api/ui/type-aliases/filterdef/).
An optional `searchable` prop adds a full-text search input across specified columns.

## Parameters

### props

[`FilterBarProps`](/api/ui/type-aliases/filterbarprops/)

See [FilterBarProps](/api/ui/type-aliases/filterbarprops/).

## Returns

`Element`

## Example

```tsx
<FilterBar
  filters={[
    { column: "published", type: "select", options: [
      { label: "Published", value: "true" },
      { label: "Draft", value: "false" },
    ]},
    { column: "createdAt", type: "dateRange" },
  ]}
  searchable={["title", "content"]}
/>
```
