---
editUrl: false
next: false
prev: false
title: "grant"
---

> **grant**(`action`, `subject`, `options?`): [`Grant`](/api/permissions/type-aliases/grant/)

Defined in: [packages/permissions/src/grant.ts:34](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/grant.ts#L34)

Declares that a role can perform an action on a subject, optionally restricted
by a row-level `where` clause.

Used inside the `grants` map of [definePermissions](/api/permissions/functions/definepermissions/) to build permission rules.
A grant without a `where` clause applies to all rows.

## Parameters

### action

[`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

The operation being permitted (`"read"`, `"create"`, `"update"`, `"delete"`, or `"manage"` for all four).

### subject

A Drizzle table reference, or `"all"` to apply to every table.

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/) | `"all"`

### options?

Optional configuration.

#### where?

[`WhereClause`](/api/permissions/type-aliases/whereclause/)

A Drizzle filter function `(columns, user) => SQL` that restricts which rows this grant covers.

## Returns

[`Grant`](/api/permissions/type-aliases/grant/)

A [Grant](/api/permissions/type-aliases/grant/) object for use in a permissions configuration.

## Example

```typescript
import { grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts } from "./schema";

// Unrestricted read on all posts
grant("read", posts);

// Only allow updating own posts
grant("update", posts, {
  where: (post, user) => eq(post.authorId, user.id),
});

// Full access to everything
grant("manage", "all");
```
