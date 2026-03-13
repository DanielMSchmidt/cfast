---
editUrl: false
next: false
prev: false
title: "DrizzleTable"
---

> **DrizzleTable** = `Record`\<`string` \| `symbol`, `any`\>

Defined in: [packages/permissions/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L8)

Minimal structural type for a Drizzle ORM table reference.

Drizzle stores table metadata via Symbols (e.g., `Symbol('drizzle:Name')`).
This loose type avoids importing `drizzle-orm` directly into the permissions package.
