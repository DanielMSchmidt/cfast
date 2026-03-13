---
editUrl: false
next: false
prev: false
title: "DrizzleTable"
---

> **DrizzleTable** = `Record`\<`string` \| `symbol`, `any`\>

Defined in: [packages/permissions/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L8)

Minimal structural type for a Drizzle ORM table reference.

Drizzle stores table metadata via Symbols (e.g., `Symbol('drizzle:Name')`).
This loose type avoids importing `drizzle-orm` directly into the permissions package.
