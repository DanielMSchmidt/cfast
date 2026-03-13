---
editUrl: false
next: false
prev: false
title: "JsonField"
---

> **JsonField**(`props`): `Element`

Defined in: [packages/ui/src/fields/json-field.tsx:21](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/fields/json-field.tsx#L21)

Read-only display component that renders a JSON value as formatted code.

When `collapsed` is true, shows a single-line preview (truncated at 60 chars)
with an "expand" button. When expanded, displays the full pretty-printed JSON
in a `<pre>` block. Returns an em-dash for null/undefined values.

## Parameters

### props

[`JsonFieldProps`](/api/ui/type-aliases/jsonfieldprops/)

See [JsonFieldProps](/api/ui/type-aliases/jsonfieldprops/).

## Returns

`Element`

A `<pre>` with formatted JSON, a collapsed preview, or a
  placeholder `<span>` for null values.

## Example

```tsx
<JsonField value={{ tags: ["react", "typescript"] }} collapsed />
// -> '{"tags":["react","typescript"]}' with expand button
```
