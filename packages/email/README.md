# @cfast/email

**Send emails from Cloudflare Workers. Write them with react-email. Swap providers with a plugin.**

Cloudflare Workers can't use SMTP. Most email libraries assume Node.js. `@cfast/email` is a Workers-native email client that renders templates with [react-email](https://react.email) and sends them through a pluggable provider backend. Ships with Mailgun. The plugin API makes it straightforward to add Resend, SES, Postmark, or your own provider later.

## Design Goals

- **Workers-native.** Uses `fetch`, not SMTP. No Node.js polyfills needed.
- **react-email first.** Templates are React components. Type-safe props. Preview in development. Render to HTML at send time.
- **Plugin-based providers.** The core handles rendering and the send API. Delivery is delegated to a provider plugin. Ships with Mailgun; more providers coming.
- **Integrated with @cfast/auth.** Auth emails (magic links, passkey confirmations) use this package under the hood. You override them with the same react-email components.

## Planned API

### Setup

```typescript
import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";

const email = createEmailClient({
  provider: mailgun({
    apiKey: env.MAILGUN_API_KEY,
    domain: "mail.myapp.com",
  }),
  from: "MyApp <hello@myapp.com>",
});
```

### Sending Emails

```typescript
import { WelcomeEmail } from "./emails/welcome";

await email.send({
  to: "user@example.com",
  subject: "Welcome to MyApp",
  react: <WelcomeEmail name="Daniel" />,
});
```

### Writing Templates

Templates are react-email components:

```tsx
// emails/welcome.tsx
import { Html, Head, Body, Text, Link } from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Hi {name},</Text>
        <Text>Welcome to MyApp. Get started by creating your first project.</Text>
        <Link href="https://myapp.com/dashboard">Go to Dashboard</Link>
      </Body>
    </Html>
  );
}
```

### Auth Email Overrides

`@cfast/auth` ships with default email templates. Override them:

```typescript
import { MagicLinkEmail } from "./emails/magic-link";

const auth = createAuth({
  // ...
  email, // Pass your @cfast/email client — auth uses whatever provider you configured
  templates: {
    magicLink: MagicLinkEmail,  // Your react-email component
    // Default templates are used for anything you don't override
  },
});
```

### Batch Sending

```typescript
await email.sendBatch([
  { to: "a@example.com", subject: "Update", react: <UpdateEmail /> },
  { to: "b@example.com", subject: "Update", react: <UpdateEmail /> },
]);
// Delegates to Mailgun's batch API for efficiency
```

### Development Mode

In development, a built-in `console` provider logs emails and serves previews locally:

```typescript
import { console as consoleDev } from "@cfast/email/console";

const email = createEmailClient({
  provider: consoleDev({ previewUrl: "http://localhost:8787/__email" }),
  from: "MyApp <hello@myapp.com>",
});
```

```
[cfast/email] Email sent (dev mode):
  To: user@example.com
  Subject: Welcome to MyApp
  Preview: http://localhost:8787/__email/preview/1
```

### Multi-Provider Fallback

Send through a primary provider, fall back to a secondary on failure:

```typescript
import { withFallback } from "@cfast/email";

const email = createEmailClient({
  provider: withFallback(primaryProvider, fallbackProvider),
  from: "MyApp <hello@myapp.com>",
});
```

### Creating a Provider Plugin

A provider is a single function. The contract is intentionally minimal so adding a new one is ~30 lines:

```typescript
import { defineProvider } from "@cfast/email";
import type { EmailProvider } from "@cfast/email";

export function myProvider(config: MyConfig): EmailProvider {
  return defineProvider({
    name: "my-provider",

    async send(message) {
      // message.to, message.from, message.subject
      // message.html — already rendered from react-email
      // message.text — auto-generated plain text fallback
      const response = await fetch("https://api.myprovider.com/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          to: message.to,
          from: message.from,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (!response.ok) {
        throw new EmailDeliveryError(await response.text());
      }

      return { id: (await response.json()).messageId };
    },

    // Optional: batch API for efficient bulk sending
    async sendBatch(messages) {
      // Default: parallel send() calls
    },
  });
}
```

## Shipped Providers

| Provider | Status |
|---|---|
| Mailgun | Shipped |
| Console (dev) | Shipped |
| Resend | Planned |
| AWS SES | Planned |
| Postmark | Planned |

## Architecture

```
@cfast/email (core)
├── createEmailClient()         — send API, template rendering
├── defineProvider()            — plugin contract
├── withFallback()              — multi-provider composition
└── react-email rendering       — JSX → HTML + plain text

@cfast/email/mailgun            — Mailgun HTTP API plugin
@cfast/email/console            — Dev mode: console log + preview server
```
