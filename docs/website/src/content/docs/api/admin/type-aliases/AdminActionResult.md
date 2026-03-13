---
editUrl: false
next: false
prev: false
title: "AdminActionResult"
---

> **AdminActionResult** = \{ `success`: `string`; \} \| \{ `error`: `string`; \} \| \{ `fieldErrors`: `Record`\<`string`, `string`\>; \}

Defined in: [packages/admin/src/types.ts:554](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L554)

Discriminated union returned by the admin action handler.

The admin component uses this to display success messages, error banners,
or per-field validation errors on forms.

- `{ success: string }` -- operation completed; display a success toast
- `{ error: string }` -- operation failed; display an error message
- `{ fieldErrors: Record<string, string> }` -- validation failed; highlight individual fields
