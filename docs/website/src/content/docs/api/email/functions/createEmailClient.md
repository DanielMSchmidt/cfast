---
editUrl: false
next: false
prev: false
title: "createEmailClient"
---

> **createEmailClient**(`config`): [`EmailClient`](/api/email/type-aliases/emailclient/)

Defined in: [packages/email/src/create-email-client.ts:35](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/email/src/create-email-client.ts#L35)

Create an email client that renders react-email templates and delivers them
through a pluggable [EmailProvider](/api/email/type-aliases/emailprovider/).

The client renders the React element to both HTML and plain-text via
`@react-email/render`, resolves the provider and sender address (supporting
lazy getters for Workers compatibility), and delegates delivery.

## Parameters

### config

[`EmailClientConfig`](/api/email/type-aliases/emailclientconfig/)

Client configuration with provider and default sender.

## Returns

[`EmailClient`](/api/email/type-aliases/emailclient/)

An [EmailClient](/api/email/type-aliases/emailclient/) with a `send` method.

## Example

```ts
import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";

const email = createEmailClient({
  provider: mailgun(() => ({
    apiKey: env.get().MAILGUN_API_KEY,
    domain: env.get().MAILGUN_DOMAIN,
  })),
  from: () => `MyApp <noreply@${env.get().MAILGUN_DOMAIN}>`,
});

await email.send({
  to: "user@example.com",
  subject: "Welcome",
  react: <WelcomeEmail name="Daniel" />,
});
```
