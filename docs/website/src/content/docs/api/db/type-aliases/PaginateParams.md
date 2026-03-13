---
editUrl: false
next: false
prev: false
title: "PaginateParams"
---

> **PaginateParams** = [`CursorParams`](/api/db/type-aliases/cursorparams/) \| [`OffsetParams`](/api/db/type-aliases/offsetparams/)

Defined in: [packages/db/src/types.ts:262](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L262)

Union of cursor and offset pagination parameters.

Use the `type` discriminant to determine which pagination strategy is in use.
Accepted by `db.query(table).paginate()`.
