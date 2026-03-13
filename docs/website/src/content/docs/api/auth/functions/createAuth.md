---
editUrl: false
next: false
prev: false
title: "createAuth"
---

> **createAuth**(`config`): (`env`) => [`AuthInstance`](/api/auth/type-aliases/authinstance/)

Defined in: [packages/auth/src/create-auth.ts:74](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/auth/src/create-auth.ts#L74)

Creates a pre-configured auth factory for Cloudflare Workers.

Returns an `initAuth()` function that accepts per-request environment bindings
([AuthEnvConfig](/api/auth/type-aliases/authenvconfig/)) and produces a fully initialized [AuthInstance](/api/auth/type-aliases/authinstance/)
with session management, role assignment, impersonation, and magic link support.

## Parameters

### config

[`AuthConfig`](/api/auth/type-aliases/authconfig/)

The auth configuration including permissions, authentication methods, and role rules.

## Returns

A factory function `(env: AuthEnvConfig) => AuthInstance` to call per-request.

> (`env`): [`AuthInstance`](/api/auth/type-aliases/authinstance/)

### Parameters

#### env

[`AuthEnvConfig`](/api/auth/type-aliases/authenvconfig/)

### Returns

[`AuthInstance`](/api/auth/type-aliases/authinstance/)

## Example

```ts
import { createAuth } from "@cfast/auth";
import { permissions } from "./permissions";

export const initAuth = createAuth({
  permissions,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      await sendEmail({ to: email, html: `<a href="${url}">Sign in</a>` });
    },
  },
  redirects: { afterLogin: "/", loginPath: "/login" },
});

// Per-request initialization:
const auth = initAuth({ d1: env.DB, appUrl: "https://myapp.com" });
const ctx = await auth.requireUser(request);
```
