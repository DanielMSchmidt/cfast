# @cfast/email Design

**Goal:** Workers-native email client with react-email rendering and pluggable provider backend.

**Architecture:** `createEmailClient({ provider, from })` returns `{ send }`. The client renders react-email JSX to HTML + plain text, then delegates delivery to a provider. Providers are plain objects matching the `EmailProvider` type. Ships with Mailgun and console (dev) providers.

## Core API

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
  from: () => `Blog <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
```

```typescript
// usage
import { email } from "~/email.server";
import { WelcomeEmail } from "~/email/templates/welcome";

await email.send({
  to: "user@example.com",
  subject: "Welcome",
  react: <WelcomeEmail name="Daniel" />,
});
```

### `createEmailClient(config)`

| Field | Type | Description |
|---|---|---|
| `provider` | `EmailProvider` | Delivery backend |
| `from` | `string \| () => string` | Default sender address. Lazy getter for env access. |

### `send(options)`

| Field | Type | Description |
|---|---|---|
| `to` | `string` | Recipient address |
| `subject` | `string` | Email subject |
| `react` | `ReactElement` | react-email component to render |
| `from?` | `string` | Override default sender |

Returns `Promise<{ id: string }>`.

Flow:
1. Calls react-email `render()` on the `react` element → produces `html` and `text`
2. Resolves `from` (calls getter if function)
3. Calls `provider.send({ to, from, subject, html, text })`
4. Returns the provider's `{ id }` response

## Provider Contract

Type-only — no wrapper function needed.

```typescript
type EmailProvider = {
  name: string;
  send: (message: EmailMessage) => Promise<{ id: string }>;
};

type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};
```

### Mailgun Provider

```typescript
import { mailgun } from "@cfast/email/mailgun";

const provider = mailgun(() => ({
  apiKey: env.get().MAILGUN_API_KEY,
  domain: env.get().MAILGUN_DOMAIN,
}));
```

Config getter is called lazily at send time. Uses Mailgun's HTTP API via `fetch`.

### Console Provider (dev)

```typescript
import { console as consoleDev } from "@cfast/email/console";

const provider = consoleDev();
```

Logs `to`, `subject`, and truncated HTML to console. Returns `{ id: "console-{uuid}" }`.

## Error Handling

```typescript
class EmailDeliveryError extends Error {
  readonly provider: string;
  readonly statusCode?: number;
  readonly response?: string;
}
```

Thrown by providers when the API call fails. The client does not catch — callers decide whether to fire-and-forget or handle errors.

## Package Exports

```
@cfast/email         → createEmailClient, EmailProvider, EmailMessage, EmailDeliveryError
@cfast/email/mailgun → mailgun
@cfast/email/console → console
```

## Future (not in v1)

- `sendBatch(messages[])` — batch API for bulk sending, delegates to provider batch endpoint
- `withFallback(primary, secondary)` — multi-provider failover
- `@cfast/auth` integration — override auth email templates with react-email components
- Additional providers: Resend, AWS SES, Postmark
