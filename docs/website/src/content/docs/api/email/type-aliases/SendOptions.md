---
editUrl: false
next: false
prev: false
title: "SendOptions"
---

> **SendOptions** = `object`

Defined in: [packages/email/src/types.ts:76](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L76)

Options passed to [EmailClient.send](/api/email/type-aliases/emailclient/#send) to compose and deliver an email.

## Properties

### from?

> `optional` **from**: `string`

Defined in: [packages/email/src/types.ts:84](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L84)

Override the default sender address for this message.

***

### react

> **react**: `ReactElement`

Defined in: [packages/email/src/types.ts:82](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L82)

A react-email component to render as the email body (HTML + plain text).

***

### subject

> **subject**: `string`

Defined in: [packages/email/src/types.ts:80](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L80)

Email subject line.

***

### to

> **to**: `string`

Defined in: [packages/email/src/types.ts:78](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L78)

Recipient email address.
