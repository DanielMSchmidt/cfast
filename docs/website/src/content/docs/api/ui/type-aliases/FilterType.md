---
editUrl: false
next: false
prev: false
title: "FilterType"
---

> **FilterType** = `"text"` \| `"select"` \| `"multiSelect"` \| `"relation"` \| `"dateRange"` \| `"boolean"` \| `"number"`

Defined in: [packages/ui/src/types.ts:440](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L440)

Supported filter input types for [FilterBarProps](/api/ui/type-aliases/filterbarprops/).

Each type determines the filter UI control and how the value is serialized
to URL search params:

- `"text"` -- Text input (`?column=value`).
- `"select"` -- Single-select dropdown (`?column=value`).
- `"multiSelect"` -- Multi-select dropdown (`?column=a,b,c`).
- `"relation"` -- Async select fetching related records (`?column=id`).
- `"dateRange"` -- Date range picker (`?column_from=...&column_to=...`).
- `"boolean"` -- Toggle/chip (`?column=true`).
- `"number"` -- Number range inputs (`?column_min=...&column_max=...`).

## See

[FilterDef](/api/ui/type-aliases/filterdef/) for the full filter definition.
