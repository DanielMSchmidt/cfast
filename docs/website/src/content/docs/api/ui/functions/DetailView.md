---
editUrl: false
next: false
prev: false
title: "DetailView"
---

> **DetailView**\<`T`\>(`props`): `Element`

Defined in: [packages/ui/src/components/detail-view.tsx:51](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/detail-view.tsx#L51)

Read-only detail page for a single record, rendered in a two-column grid.

Composes [PageContainer](/api/ui/functions/pagecontainer/) with automatic TypedField rendering. When a Drizzle
`table` is provided, field types are inferred from column metadata and rendered with
the appropriate field component (DateField, BooleanField, etc.). Fields can also be
specified manually as strings or full [ColumnDef](/api/ui/type-aliases/columndef/) objects with custom renderers.

If no `fields` are specified, they are inferred from the record's own keys
(minus any keys listed in `exclude`).

## Type Parameters

### T

`T` = `unknown`

The record data type.

## Parameters

### props

[`DetailViewProps`](/api/ui/type-aliases/detailviewprops/)\<`T`\>

See [DetailViewProps](/api/ui/type-aliases/detailviewprops/).

## Returns

`Element`

## Example

```tsx
<DetailView
  title={post.title}
  table={posts}
  record={post}
  fields={["title", "content", "author", "published", "createdAt"]}
  breadcrumb={[
    { label: "Posts", to: "/posts" },
    { label: post.title },
  ]}
/>
```
