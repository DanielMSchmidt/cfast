---
editUrl: false
next: false
prev: false
title: "DrizzleTable"
---

> **DrizzleTable** = `Record`\<`string` \| `symbol`, `any`\>

Defined in: [packages/permissions/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L8)

Minimal structural type for a Drizzle ORM table reference.

Drizzle stores table metadata via Symbols (e.g., `Symbol('drizzle:Name')`).
This loose type avoids importing `drizzle-orm` directly into the permissions package.
