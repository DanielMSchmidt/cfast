<p align="center">
  <img src="docs/website/src/assets/cfast-logo.png" alt="CFast" width="200" />
</p>

<h1 align="center">CFast</h1>

<p align="center"><strong>Skip the boring parts. Build your Cloudflare Workers app.</strong></p>

CFast is a collection of composable TypeScript libraries that make building production-ready web applications on Cloudflare Workers with React Router fast, secure, and enjoyable. It is opinionated where it matters and invisible where it doesn't.

## The Stack

CFast is built around a specific, proven stack:

- **Runtime:** Cloudflare Workers
- **Framework:** React Router v7+ (file-based routing)
- **Database:** Cloudflare D1 via Drizzle ORM
- **Auth:** Better Auth (magic email + passkeys)
- **Email:** Mailgun via react-email
- **Storage:** Cloudflare R2
- **UI:** Plugin-based (ships with MUI Joy UI)

## Packages

### Core

| Package | Description |
|---|---|
| [`@cfast/env`](packages/env) | Type-safe Cloudflare bindings with runtime validation |
| [`@cfast/permissions`](packages/permissions) | Isomorphic permission system with Drizzle-native row-level access control |
| [`@cfast/auth`](packages/auth) | Authentication: magic email, passkeys, role management, impersonation |
| [`@cfast/db`](packages/db) | Permission-aware Drizzle queries for D1 |
| [`@cfast/storage`](packages/storage) | Schema-driven file uploads to R2 with multipart support |

### UI & Developer Experience

| Package | Description |
|---|---|
| [`@cfast/actions`](packages/actions) | Multi-action routes and permission-aware action definitions |
| [`@cfast/ui`](packages/ui) | Permission-aware component wrappers (ActionButton, PermissionGate) |
| [`@cfast/forms`](packages/forms) | Auto-generated forms from Drizzle schema |
| [`@cfast/pagination`](packages/pagination) | Cursor-based, offset-based pagination and infinite scroll |
| [`@cfast/admin`](packages/admin) | Auto-generated admin UI from your Drizzle schema |
| [`@cfast/email`](packages/email) | Plugin-based email with react-email rendering |

### Tooling

| Package | Description |
|---|---|
| [`create-cfast`](packages/create-cfast) | Scaffold a fully wired project in seconds |

## Philosophy

1. **Permissions are first-class.** Define them once. Enforce on the server. Reflect in the UI. Compose across actions. The developer writes the permission rules and the business logic, and never touches permission plumbing again.

2. **The database drives the UI.** Your Drizzle schema is the source of truth. Forms, admin panels, and CRUD interfaces are derived from it, customizable but never written from scratch.

3. **Common patterns, not configuration.** Multi-action routes, infinite scroll, pagination, magic-link auth, role management. These aren't novel problems. They're solved once, correctly, and you import them.

4. **Isomorphic by design.** Permission checks, validation, and data types work identically on client and server. The button knows it should be disabled before the request is ever made.

## Quick Start

```bash
npm create cfast@latest my-app
```

## License

MIT
