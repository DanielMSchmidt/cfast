---
editUrl: false
next: false
prev: false
title: "EmailProvider"
---

> **EmailProvider** = `object`

Defined in: [packages/email/src/types.ts:46](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L46)

A pluggable email delivery backend.

Implement this interface to add support for a new email service. The provider
receives a fully rendered [EmailMessage](/api/email/type-aliases/emailmessage/) and is responsible for delivering
it via the service's HTTP API.

## Example

```ts
import type { EmailProvider, EmailMessage } from "@cfast/email";

const myProvider: EmailProvider = {
  name: "my-provider",
  async send(message: EmailMessage) {
    const res = await fetch("https://api.example.com/send", {
      method: "POST",
      body: JSON.stringify(message),
    });
    const data = await res.json() as { id: string };
    return { id: data.id };
  },
};
```

## Properties

### name

> **name**: `string`

Defined in: [packages/email/src/types.ts:48](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L48)

Unique name identifying the provider (e.g. `"mailgun"`, `"console"`).

***

### send()

> **send**: (`message`) => `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/email/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L50)

Deliver a rendered email message. Returns a provider-specific message ID.

#### Parameters

##### message

[`EmailMessage`](/api/email/type-aliases/emailmessage/)

#### Returns

`Promise`\<\{ `id`: `string`; \}\>
