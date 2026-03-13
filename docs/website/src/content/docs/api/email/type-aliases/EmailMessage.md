---
editUrl: false
next: false
prev: false
title: "EmailMessage"
---

> **EmailMessage** = `object`

Defined in: [packages/email/src/types.ts:9](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L9)

A fully rendered email message ready for delivery by an [EmailProvider](/api/email/type-aliases/emailprovider/).

Contains the rendered HTML and plain-text bodies (produced from the React element),
along with addressing and subject metadata.

## Properties

### from

> **from**: `string`

Defined in: [packages/email/src/types.ts:13](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L13)

Sender address (e.g. `"MyApp <noreply@example.com>"`).

***

### html

> **html**: `string`

Defined in: [packages/email/src/types.ts:17](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L17)

HTML body rendered from the react-email component.

***

### subject

> **subject**: `string`

Defined in: [packages/email/src/types.ts:15](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L15)

Email subject line.

***

### text

> **text**: `string`

Defined in: [packages/email/src/types.ts:19](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L19)

Plain-text body rendered from the react-email component.

***

### to

> **to**: `string`

Defined in: [packages/email/src/types.ts:11](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/types.ts#L11)

Recipient email address.
