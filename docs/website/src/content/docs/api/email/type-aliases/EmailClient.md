---
editUrl: false
next: false
prev: false
title: "EmailClient"
---

> **EmailClient** = `object`

Defined in: [packages/email/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L93)

An email client instance returned by [createEmailClient](/api/email/functions/createemailclient/).

Renders react-email components and delivers them through the configured
[EmailProvider](/api/email/type-aliases/emailprovider/).

## Properties

### send()

> **send**: (`options`) => `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/email/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/types.ts#L100)

Render a react-email component and send the resulting email.

#### Parameters

##### options

[`SendOptions`](/api/email/type-aliases/sendoptions/)

The message details including recipient, subject, and React template.

#### Returns

`Promise`\<\{ `id`: `string`; \}\>

The provider-specific message ID.
