---
editUrl: false
next: false
prev: false
title: "PaginateParams"
---

> **PaginateParams** = [`CursorParams`](/api/db/type-aliases/cursorparams/) \| [`OffsetParams`](/api/db/type-aliases/offsetparams/)

Defined in: [packages/db/src/types.ts:262](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L262)

Union of cursor and offset pagination parameters.

Use the `type` discriminant to determine which pagination strategy is in use.
Accepted by `db.query(table).paginate()`.
