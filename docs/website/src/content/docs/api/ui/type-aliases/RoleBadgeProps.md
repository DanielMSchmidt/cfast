---
editUrl: false
next: false
prev: false
title: "RoleBadgeProps"
---

> **RoleBadgeProps** = `object`

Defined in: [packages/ui/src/types.ts:1317](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1317)

Props for the RoleBadge component.

Displays a colored chip badge for a user's role from `@cfast/permissions`.
Colors are configurable per role name; defaults provide sensible mappings
(e.g., "admin" -> danger, "editor" -> primary, "reader" -> neutral).

## See

 - [ChipSlotProps](/api/ui/type-aliases/chipslotprops/) for the underlying chip slot.
 - [UserMenuProps](/api/ui/type-aliases/usermenuprops/) where role badges are displayed.

## Properties

### colors?

> `optional` **colors**: `Record`\<`string`, `string`\>

Defined in: [packages/ui/src/types.ts:1321](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1321)

Custom color map from role name to chip color.

***

### role

> **role**: `string`

Defined in: [packages/ui/src/types.ts:1319](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1319)

Role name to display.
