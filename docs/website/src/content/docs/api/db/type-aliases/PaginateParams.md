---
editUrl: false
next: false
prev: false
title: "PaginateParams"
---

> **PaginateParams** = [`CursorParams`](/api/db/type-aliases/cursorparams/) \| [`OffsetParams`](/api/db/type-aliases/offsetparams/)

Defined in: [packages/db/src/types.ts:262](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L262)

Union of cursor and offset pagination parameters.

Use the `type` discriminant to determine which pagination strategy is in use.
Accepted by `db.query(table).paginate()`.
