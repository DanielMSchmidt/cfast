---
editUrl: false
next: false
prev: false
title: "DrizzleTable"
---

> **DrizzleTable** = `Record`\<`string` \| `symbol`, `any`\>

Defined in: [packages/permissions/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L8)

Minimal structural type for a Drizzle ORM table reference.

Drizzle stores table metadata via Symbols (e.g., `Symbol('drizzle:Name')`).
This loose type avoids importing `drizzle-orm` directly into the permissions package.
