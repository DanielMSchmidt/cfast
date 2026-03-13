---
editUrl: false
next: false
prev: false
title: "UserMenuLink"
---

> **UserMenuLink** = `object`

Defined in: [packages/ui/src/types.ts:1150](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1150)

A navigation link in the user menu dropdown.

When `action` is provided, the link is automatically hidden if the current
user lacks permission for that action (e.g., an "Admin" link gated on admin access).

## See

[UserMenuProps](/api/ui/type-aliases/usermenuprops/) which accepts an array of these links.

## Properties

### action?

> `optional` **action**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:1156](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1156)

If provided, the link is hidden when the user lacks permission.

***

### label

> **label**: `string`

Defined in: [packages/ui/src/types.ts:1152](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1152)

Display label.

***

### to

> **to**: `string`

Defined in: [packages/ui/src/types.ts:1154](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1154)

Route path.
