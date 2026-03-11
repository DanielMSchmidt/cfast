# @cfast/email Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a Workers-native email client with react-email rendering and pluggable provider backend (Mailgun + console dev provider).

**Architecture:** `createEmailClient({ provider, from })` returns `{ send }`. The client renders react-email JSX via `@react-email/render`, then delegates delivery to an `EmailProvider` object. Providers are type-only contracts — plain objects with `{ name, send }`. Ships with Mailgun HTTP API provider and a console provider for development.

**Tech Stack:** TypeScript, React, @react-email/render, @react-email/components (peer dep), Cloudflare Workers (fetch-only, no SMTP)

---

### Task 1: Package Setup and Core Types

**Files:**
- Modify: `packages/email/package.json`
- Modify: `packages/email/tsconfig.json`
- Create: `packages/email/vitest.config.ts`
- Create: `packages/email/src/types.ts`
- Create: `packages/email/src/errors.ts`
- Modify: `packages/email/src/index.ts`

**Context:** Set up the package with dependencies, define the core types (`EmailProvider`, `EmailMessage`, `EmailClientConfig`, `SendOptions`), and the `EmailDeliveryError` class.

**Step 1: Update package.json**

Add dependencies and scripts. Key deps:
- `@react-email/render` — for JSX → HTML + plain text rendering
- `react` — peer dep (needed by react-email)
- `@react-email/components` — peer dep (templates use these)
- `vitest` — dev dep for testing

```json
{
  "name": "@cfast/email",
  "version": "0.0.1",
  "description": "Plugin-based email for Cloudflare Workers with react-email rendering",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./mailgun": {
      "import": "./dist/mailgun.js",
      "types": "./dist/mailgun.d.ts"
    },
    "./console": {
      "import": "./dist/console.js",
      "types": "./dist/console.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/mailgun.ts src/console.ts --format esm --dts",
    "dev": "tsup src/index.ts src/mailgun.ts src/console.ts --format esm --dts --watch",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "@react-email/components": "^1.0.0"
  },
  "dependencies": {
    "@react-email/render": "^2.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260305.1",
    "@react-email/components": "^1.0.0",
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

**Step 2: Update tsconfig.json**

Add JSX support and workers types:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
```

**Step 4: Create types.ts**

```typescript
import type { ReactElement } from "react";

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailProvider = {
  name: string;
  send: (message: EmailMessage) => Promise<{ id: string }>;
};

export type EmailClientConfig = {
  provider: EmailProvider;
  from: string | (() => string);
};

export type SendOptions = {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
};

export type EmailClient = {
  send: (options: SendOptions) => Promise<{ id: string }>;
};
```

**Step 5: Create errors.ts**

```typescript
export class EmailDeliveryError extends Error {
  readonly provider: string;
  readonly statusCode?: number;
  readonly response?: string;

  constructor(
    message: string,
    options: { provider: string; statusCode?: number; response?: string },
  ) {
    super(message);
    this.name = "EmailDeliveryError";
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.response = options.response;
  }
}
```

**Step 6: Update index.ts with exports**

```typescript
export { createEmailClient } from "./create-email-client.js";
export { EmailDeliveryError } from "./errors.js";
export type {
  EmailClient,
  EmailClientConfig,
  EmailMessage,
  EmailProvider,
  SendOptions,
} from "./types.js";
```

Note: `createEmailClient` doesn't exist yet — that's Task 2. The export will cause a type error until then. That's fine.

**Step 7: Run pnpm install, commit**

```bash
pnpm install
git add packages/email/
git commit -m "feat(email): package setup, core types, EmailDeliveryError"
```

---

### Task 2: `createEmailClient` Implementation

**Files:**
- Create: `packages/email/src/create-email-client.ts`
- Create: `packages/email/src/__tests__/create-email-client.test.ts`

**Context:** The core factory function that creates an email client. It renders react-email JSX to HTML + plain text using `@react-email/render`, then delegates to the provider.

**Step 1: Write tests**

```typescript
import { describe, it, expect, vi } from "vitest";
import { createEmailClient } from "../create-email-client.js";
import type { EmailProvider } from "../types.js";

function createMockProvider(): EmailProvider & { lastMessage: unknown } {
  const provider: EmailProvider & { lastMessage: unknown } = {
    name: "mock",
    lastMessage: null,
    send: vi.fn(async (message) => {
      provider.lastMessage = message;
      return { id: "mock-123" };
    }),
  };
  return provider;
}

// Simple React element for testing (no react-email components needed)
function TestEmail({ name }: { name: string }) {
  return <div>Hello {name}</div>;
}

describe("createEmailClient", () => {
  it("returns an object with send method", () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });
    expect(typeof client.send).toBe("function");
  });

  it("renders react element to HTML and passes to provider", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    expect(provider.send).toHaveBeenCalledOnce();
    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.to).toBe("user@example.com");
    expect(message.from).toBe("test@example.com");
    expect(message.subject).toBe("Test");
    expect(typeof message.html).toBe("string");
    expect((message.html as string)).toContain("Hello World");
    expect(typeof message.text).toBe("string");
  });

  it("uses from getter when from is a function", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({
      provider,
      from: () => "lazy@example.com",
    });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.from).toBe("lazy@example.com");
  });

  it("allows overriding from per-send", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "default@example.com" });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
      from: "override@example.com",
    });

    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.from).toBe("override@example.com");
  });

  it("returns the provider result", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });

    const result = await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    expect(result).toEqual({ id: "mock-123" });
  });

  it("propagates provider errors", async () => {
    const provider: EmailProvider = {
      name: "failing",
      send: async () => { throw new Error("Provider failed"); },
    };
    const client = createEmailClient({ provider, from: "test@example.com" });

    await expect(
      client.send({ to: "user@example.com", subject: "Test", react: <TestEmail name="World" /> }),
    ).rejects.toThrow("Provider failed");
  });
});
```

**Step 2: Implement createEmailClient**

```typescript
import { render } from "@react-email/render";
import type { EmailClient, EmailClientConfig, SendOptions } from "./types.js";

export function createEmailClient(config: EmailClientConfig): EmailClient {
  return {
    async send(options: SendOptions): Promise<{ id: string }> {
      const html = await render(options.react);
      const text = await render(options.react, { plainText: true });

      const from = options.from
        ?? (typeof config.from === "function" ? config.from() : config.from);

      return config.provider.send({
        to: options.to,
        from,
        subject: options.subject,
        html,
        text,
      });
    },
  };
}
```

**Step 3: Run tests, verify, commit**

```bash
pnpm --filter @cfast/email test
pnpm --filter @cfast/email typecheck
git add packages/email/
git commit -m "feat(email): createEmailClient with react-email rendering"
```

---

### Task 3: Mailgun Provider

**Files:**
- Create: `packages/email/src/mailgun.ts`
- Create: `packages/email/src/__tests__/mailgun.test.ts`

**Context:** The Mailgun provider sends emails via Mailgun's HTTP API using `fetch`. Config is a lazy getter function called at send time (for Workers env access).

**Step 1: Write tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mailgun } from "../mailgun.js";
import { EmailDeliveryError } from "../errors.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("mailgun", () => {
  const getConfig = () => ({
    apiKey: "test-api-key",
    domain: "mail.example.com",
  });

  it("returns an EmailProvider with name 'mailgun'", () => {
    const provider = mailgun(getConfig);
    expect(provider.name).toBe("mailgun");
    expect(typeof provider.send).toBe("function");
  });

  it("sends email via Mailgun HTTP API", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "<msg-123@mail.example.com>", message: "Queued" }), {
        status: 200,
      }),
    );

    const provider = mailgun(getConfig);
    const result = await provider.send({
      to: "user@example.com",
      from: "App <noreply@mail.example.com>",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result.id).toBe("<msg-123@mail.example.com>");
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.mailgun.net/v3/mail.example.com/messages");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toContain("Basic ");
  });

  it("includes all fields in FormData body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "msg-1" }), { status: 200 }),
    );

    const provider = mailgun(getConfig);
    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test Subject",
      html: "<b>Bold</b>",
      text: "Bold",
    });

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("to")).toBe("user@example.com");
    expect(body.get("from")).toBe("sender@example.com");
    expect(body.get("subject")).toBe("Test Subject");
    expect(body.get("html")).toBe("<b>Bold</b>");
    expect(body.get("text")).toBe("Bold");
  });

  it("calls config getter lazily at send time", async () => {
    const getter = vi.fn(() => ({
      apiKey: "lazy-key",
      domain: "lazy.example.com",
    }));

    const provider = mailgun(getter);
    // Config getter not called yet
    expect(getter).not.toHaveBeenCalled();

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "msg-1" }), { status: 200 }),
    );

    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(getter).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("lazy.example.com");
  });

  it("throws EmailDeliveryError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    const provider = mailgun(getConfig);

    await expect(
      provider.send({
        to: "user@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    ).rejects.toThrow(EmailDeliveryError);
  });

  it("includes status code and response body in error", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Bad request: missing 'to'", { status: 400 }),
    );

    const provider = mailgun(getConfig);

    try {
      await provider.send({
        to: "",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
        text: "Hi",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(EmailDeliveryError);
      const e = error as EmailDeliveryError;
      expect(e.provider).toBe("mailgun");
      expect(e.statusCode).toBe(400);
      expect(e.response).toBe("Bad request: missing 'to'");
    }
  });
});
```

**Step 2: Implement mailgun provider**

```typescript
import type { EmailMessage, EmailProvider } from "./types.js";
import { EmailDeliveryError } from "./errors.js";

type MailgunConfig = {
  apiKey: string;
  domain: string;
};

export function mailgun(getConfig: () => MailgunConfig): EmailProvider {
  return {
    name: "mailgun",

    async send(message: EmailMessage): Promise<{ id: string }> {
      const config = getConfig();

      const form = new FormData();
      form.append("from", message.from);
      form.append("to", message.to);
      form.append("subject", message.subject);
      form.append("html", message.html);
      form.append("text", message.text);

      const response = await fetch(
        `https://api.mailgun.net/v3/${config.domain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${config.apiKey}`)}`,
          },
          body: form,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new EmailDeliveryError(
          `Mailgun API error: ${response.status} ${body}`,
          {
            provider: "mailgun",
            statusCode: response.status,
            response: body,
          },
        );
      }

      const data = await response.json() as { id: string };
      return { id: data.id };
    },
  };
}
```

**Step 3: Run tests, commit**

```bash
pnpm --filter @cfast/email test
git add packages/email/
git commit -m "feat(email): Mailgun provider with lazy config"
```

---

### Task 4: Console Provider (Dev)

**Files:**
- Create: `packages/email/src/console.ts`
- Create: `packages/email/src/__tests__/console.test.ts`

**Context:** A development provider that logs emails to console. Returns a synthetic ID.

**Step 1: Write tests**

```typescript
import { describe, it, expect, vi } from "vitest";
import { console as consoleDev } from "../console.js";

describe("console provider", () => {
  it("returns an EmailProvider with name 'console'", () => {
    const provider = consoleDev();
    expect(provider.name).toBe("console");
    expect(typeof provider.send).toBe("function");
  });

  it("logs email details to console", async () => {
    const spy = vi.spyOn(globalThis.console, "log").mockImplementation(() => {});

    const provider = consoleDev();
    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test Email",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("user@example.com");
    expect(output).toContain("Test Email");

    spy.mockRestore();
  });

  it("returns an id starting with 'console-'", async () => {
    vi.spyOn(globalThis.console, "log").mockImplementation(() => {});

    const provider = consoleDev();
    const result = await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result.id).toMatch(/^console-/);

    vi.restoreAllMocks();
  });
});
```

**Step 2: Implement console provider**

```typescript
import type { EmailMessage, EmailProvider } from "./types.js";

let counter = 0;

export function console(): EmailProvider {
  return {
    name: "console",

    async send(message: EmailMessage): Promise<{ id: string }> {
      const id = `console-${++counter}`;

      globalThis.console.log(
        `\n[cfast/email] Email sent (dev mode):\n` +
        `  ID: ${id}\n` +
        `  To: ${message.to}\n` +
        `  From: ${message.from}\n` +
        `  Subject: ${message.subject}\n` +
        `  HTML: ${message.html.length} chars\n`,
      );

      return { id };
    },
  };
}
```

**Note:** The function is named `console` which shadows the global. This is intentional — it matches the export path `@cfast/email/console`. Users import it as `import { console as consoleDev } from "@cfast/email/console"`.

**Step 3: Run tests, commit**

```bash
pnpm --filter @cfast/email test
git add packages/email/
git commit -m "feat(email): console dev provider"
```

---

### Task 5: Migrate Example App

**Files:**
- Create: `examples/team-blog-after/app/email.server.ts`
- Modify: `examples/team-blog-after/app/email/send.ts`
- Modify: `examples/team-blog-after/app/email/templates/magic-link.tsx`
- Modify: `examples/team-blog-after/app/email/templates/post-published.tsx`
- Modify: `examples/team-blog-after/app/email/templates/new-comment.tsx`
- Delete: `examples/team-blog-after/app/email/mailgun.ts`
- Modify: `examples/team-blog-after/package.json`

**Context:** Replace the manual Mailgun HTTP calls and `renderToStaticMarkup` with `@cfast/email`. Keep the same template components and send functions, but use the email client.

**Step 1: Add @cfast/email dep to example app**

In `examples/team-blog-after/package.json`, add:
```json
"@cfast/email": "workspace:*",
"@react-email/components": "^1.0.0"
```

Run `pnpm install`.

**Step 2: Create email client setup**

`examples/team-blog-after/app/email.server.ts`:
```typescript
import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";
import { env } from "~/env";

export const email = createEmailClient({
  provider: mailgun(() => ({
    apiKey: env.get().MAILGUN_API_KEY,
    domain: env.get().MAILGUN_DOMAIN,
  })),
  from: () => `Team Blog <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
```

**Step 3: Update send.ts to use the email client**

Replace `renderToStaticMarkup` + manual `sendEmail` with `email.send({ react: <Component /> })`:

```typescript
import { email } from "~/email.server";
import { MagicLinkEmail } from "./templates/magic-link";
import { PostPublishedEmail } from "./templates/post-published";
import { NewCommentEmail } from "./templates/new-comment";
import type { Env } from "~/env";
import { createDbClient } from "~/db/client";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function sendMagicLinkEmail(_env: Env, emailAddress: string, url: string) {
  await email.send({
    to: emailAddress,
    subject: "Sign in to Team Blog",
    react: MagicLinkEmail({ url }),
  });
}

export async function sendPostPublishedEmail(
  env: Env,
  post: { title: string; slug: string; authorId: string },
) {
  const db = createDbClient(env.DB);
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();
  if (!author) return;

  const postUrl = `${env.APP_URL}/posts/${post.slug}`;
  await email.send({
    to: author.email,
    subject: `Your post "${post.title}" has been published!`,
    react: PostPublishedEmail({
      authorName: author.name,
      postTitle: post.title,
      postUrl,
    }),
  });
}

export async function sendNewCommentEmail(
  env: Env,
  post: { id: string; title: string; slug: string; authorId: string },
  commenter: { name: string },
  content: string,
) {
  const db = createDbClient(env.DB);
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();
  if (!author) return;

  const postUrl = `${env.APP_URL}/posts/${post.slug}`;
  await email.send({
    to: author.email,
    subject: `New comment on "${post.title}"`,
    react: NewCommentEmail({
      authorName: author.name,
      commenterName: commenter.name,
      postTitle: post.title,
      commentContent: content,
      postUrl,
    }),
  });
}
```

**Step 4: Delete the old mailgun.ts helper**

Remove `examples/team-blog-after/app/email/mailgun.ts` — no longer needed.

**Step 5: Optionally update templates to use @react-email/components**

If the templates can be updated to use react-email components (`Html`, `Head`, `Body`, `Text`, `Link`, `Button`, `Section`), do so. If react-email components cause issues with Workers/tsup, keep the plain JSX templates as-is — they work fine with react-email's `render()`.

**Step 6: Typecheck and commit**

```bash
pnpm --filter @cfast/email build
pnpm --filter team-blog-after typecheck
git add examples/team-blog-after/ packages/email/
git commit -m "feat(example): migrate email to @cfast/email"
```

---

### Task 6: Update README and Final Verification

**Files:**
- Modify: `packages/email/README.md`

**Step 1: Update README to match actual implementation**

Rewrite the README to document:
- Factory setup with `createEmailClient`
- `send()` API with `react` element
- Mailgun provider with lazy config getter
- Console dev provider
- `EmailProvider` type contract for custom providers
- `EmailDeliveryError` error handling
- Future plans section (batch, fallback, auth integration, more providers)

**Step 2: Run full monorepo verification**

```bash
pnpm test
pnpm typecheck
pnpm build
```

**Step 3: Commit**

```bash
git add packages/email/README.md
git commit -m "docs(email): update README to match implemented API"
```
