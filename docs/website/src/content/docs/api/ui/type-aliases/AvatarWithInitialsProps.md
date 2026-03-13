---
editUrl: false
next: false
prev: false
title: "AvatarWithInitialsProps"
---

> **AvatarWithInitialsProps** = `object`

Defined in: [packages/ui/src/types.ts:1296](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1296)

Props for the AvatarWithInitials component.

Avatar component with automatic initials fallback when no image is available.
Extracts initials from the `name` prop (e.g., "Daniel Schmidt" becomes "DS").
Used by [UserMenuProps](/api/ui/type-aliases/usermenuprops/) for the user avatar display.

## Properties

### name

> **name**: `string`

Defined in: [packages/ui/src/types.ts:1300](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1300)

Full name used to derive initials.

***

### size?

> `optional` **size**: `"sm"` \| `"md"` \| `"lg"`

Defined in: [packages/ui/src/types.ts:1302](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1302)

Avatar size. Defaults to "md".

***

### src?

> `optional` **src**: `string` \| `null`

Defined in: [packages/ui/src/types.ts:1298](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L1298)

Avatar image URL. Falls back to initials when null.
