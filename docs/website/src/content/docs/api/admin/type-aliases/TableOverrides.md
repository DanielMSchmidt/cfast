---
editUrl: false
next: false
prev: false
title: "TableOverrides"
---

> **TableOverrides** = `object`

Defined in: [packages/admin/src/types.ts:183](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L183)

Per-table customization for how a table appears and behaves in the admin panel.

Any table not listed in the `tables` config uses sensible defaults derived
from schema introspection. Auth-internal tables (session, account, verification,
passkey) are auto-excluded unless explicitly configured.

## Example

```typescript
const postsOverrides: TableOverrides = {
  label: "Blog Posts",
  listColumns: ["title", "author", "published", "createdAt"],
  searchable: ["title", "content"],
  defaultSort: { column: "createdAt", direction: "desc" },
  fields: {
    content: { component: RichTextEditor },
  },
};
```

## Properties

### actions?

> `optional` **actions**: `object`

Defined in: [packages/admin/src/types.ts:195](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L195)

Custom row-level and table-level actions. See [RowAction](/api/admin/type-aliases/rowaction/) and [TableAction](/api/admin/type-aliases/tableaction/).

#### row?

> `optional` **row**: [`RowAction`](/api/admin/type-aliases/rowaction/)[]

#### table?

> `optional` **table**: [`TableAction`](/api/admin/type-aliases/tableaction/)[]

***

### defaultSort?

> `optional` **defaultSort**: `object`

Defined in: [packages/admin/src/types.ts:191](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L191)

Default sort order for the list view. Defaults to primary key descending.

#### column

> **column**: `string`

#### direction

> **direction**: `"asc"` \| `"desc"`

***

### exclude?

> `optional` **exclude**: `boolean`

Defined in: [packages/admin/src/types.ts:197](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L197)

Set to `true` to hide this table from the admin panel entirely.

***

### fields?

> `optional` **fields**: `Record`\<`string`, [`FieldConfig`](/api/forms/type-aliases/fieldconfig/)\>

Defined in: [packages/admin/src/types.ts:193](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L193)

Custom field configurations for create/edit forms, keyed by column name. Passed to `@cfast/forms`.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/admin/src/types.ts:185](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L185)

Custom display label for the table in the sidebar and views. Defaults to a pluralized title-case version of the table name.

***

### listColumns?

> `optional` **listColumns**: `string`[]

Defined in: [packages/admin/src/types.ts:187](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L187)

Column names to show in the list view. Defaults to all non-primary-key columns.

***

### searchable?

> `optional` **searchable**: `string`[]

Defined in: [packages/admin/src/types.ts:189](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L189)

Column names that support text search in the list view. Defaults to the first text column.
