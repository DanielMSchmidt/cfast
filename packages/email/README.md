# @cfast/email

**Send emails from Cloudflare Workers. Write them with react-email. Swap providers with a plugin.**

Cloudflare Workers can't use SMTP. Most email libraries assume Node.js. `@cfast/email` is a Workers-native email client that renders templates with [react-email](https://react.email) and sends them through a pluggable provider backend. Ships with Mailgun and a console provider for development.

## Setup

```typescript
// app/email.server.ts
import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";
import { env } from "~/env";

export const email = createEmailClient({
  provider: mailgun(() => ({
    apiKey: env.get().MAILGUN_API_KEY,
    domain: env.get().MAILGUN_DOMAIN,
  })),
  from: () => `MyApp <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
```

Both `provider` config and `from` use getter functions — they're called lazily at send time, which is the Workers-friendly pattern for accessing env bindings.

## Sending Emails

```typescript
import { email } from "~/email.server";
import { WelcomeEmail } from "~/email/templates/welcome";

await email.send({
  to: "user@example.com",
  subject: "Welcome to MyApp",
  react: <WelcomeEmail name="Daniel" />,
});
```

The client renders the React element to HTML and plain text via `@react-email/render`, then delegates delivery to the provider.

### `send(options)`

| Field | Type | Description |
|---|---|---|
| `to` | `string` | Recipient address |
| `subject` | `string` | Email subject |
| `react` | `ReactElement` | react-email component to render |
| `from?` | `string` | Override default sender |

Returns `Promise<{ id: string }>`.

## Writing Templates

Templates are React components. Any valid `ReactElement` works — you can use `@react-email/components` for structure or plain JSX:

```tsx
// email/templates/welcome.tsx
import { Html, Head, Body, Text, Link } from "@react-email/components";

type WelcomeEmailProps = {
  name: string;
};

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Hi {name},</Text>
        <Text>Welcome to MyApp.</Text>
        <Link href="https://myapp.com/dashboard">Go to Dashboard</Link>
      </Body>
    </Html>
  );
}
```

## Providers

### Mailgun

```typescript
import { mailgun } from "@cfast/email/mailgun";

const provider = mailgun(() => ({
  apiKey: env.get().MAILGUN_API_KEY,
  domain: env.get().MAILGUN_DOMAIN,
}));
```

Sends via Mailgun's HTTP API using `fetch` and `FormData`. Config getter is called at send time.

### Console (Development)

```typescript
import { console as consoleDev } from "@cfast/email/console";

const provider = consoleDev();
```

Logs email details to console. Returns `{ id: "console-{uuid}" }`. Useful for local development without sending real emails.

```
[cfast/email] Email sent (dev mode):
  ID: console-a1b2c3d4-...
  To: user@example.com
  From: MyApp <noreply@mail.myapp.com>
  Subject: Welcome to MyApp
  HTML: 1234 chars
```

### Custom Providers

A provider is a plain object matching the `EmailProvider` type:

```typescript
import type { EmailProvider, EmailMessage } from "@cfast/email";
import { EmailDeliveryError } from "@cfast/email";

const myProvider: EmailProvider = {
  name: "my-provider",

  async send(message: EmailMessage): Promise<{ id: string }> {
    const response = await fetch("https://api.myprovider.com/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new EmailDeliveryError(await response.text(), {
        provider: "my-provider",
        statusCode: response.status,
        response: await response.text(),
      });
    }

    const data = await response.json();
    return { id: data.id };
  },
};
```

## Error Handling

Providers throw `EmailDeliveryError` on delivery failures:

```typescript
import { EmailDeliveryError } from "@cfast/email";

try {
  await email.send({ to, subject, react: <Template /> });
} catch (error) {
  if (error instanceof EmailDeliveryError) {
    console.error(error.provider);    // "mailgun"
    console.error(error.statusCode);  // 401
    console.error(error.response);    // "Unauthorized"
  }
}
```

The client does not catch — callers decide whether to fire-and-forget or handle errors.

## Package Exports

```
@cfast/email         → createEmailClient, EmailDeliveryError, types
@cfast/email/mailgun → mailgun
@cfast/email/console → console
```

## Future (not in v1)

- `sendBatch(messages[])` — batch API for bulk sending
- `withFallback(primary, secondary)` — multi-provider failover
- `@cfast/auth` integration — override auth email templates with react-email components
- Additional providers: Resend, AWS SES, Postmark
