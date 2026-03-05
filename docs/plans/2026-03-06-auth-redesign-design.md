# @cfast/auth Redesign Design

**Date:** 2026-03-06
**Status:** Approved
**Output artifact:** `packages/auth/README.md` (updated)

## Context

The original `@cfast/auth` README had a basic API where magic email and passkeys were separate flows. The redesign introduces an email-first login UX, overridable UI components, cookie-based redirect handling, and tighter React Router integration.

## Decisions

| Decision | Choice | Alternatives Considered |
|---|---|---|
| Login flow | Email-first: user enters email, then picks passkey or magic link | Separate flows per method |
| Passkey visibility | Always show both buttons regardless of registration status | Check server, conditional display |
| UI overrides | Component slots (EmailInput, PasskeyButton, etc.) | Full page override; headless hooks only |
| Redirect storage | Cookie (`cfast_redirect_to`, HttpOnly, 10min TTL) | URL search param; both |
| Route protection | `AuthGuard` wraps layout routes, loader calls `requireUser` | Per-route wrapping; `useCurrentUser` redirect |
| Auth routes | React Router plugin (`createAuthPlugin`) injects callback/passkey routes | Consumer creates route files manually |
| Login page | Consumer creates route, renders `<LoginPage>` from package | Package owns the route file |
| Default UI | MUI Joy UI components | Unstyled HTML; dual entrypoints |
| Architecture | Hybrid: thin provider reads loader data, server does heavy lifting | Full provider with client fetch; loader-only no provider |

## Package Exports

- `.` — Server: `createAuth`, types
- `./client` — Client: `AuthProvider`, `AuthGuard`, `LoginPage`, `useCurrentUser`, `useAuth`, `LoginComponents` type
- `./plugin` — React Router plugin: `createAuthPlugin`
- `./schema` — Drizzle schema: auth tables for migrations

## Redirect Flow

1. Unauthenticated user hits protected route
2. `auth.requireUser()` sets `cfast_redirect_to` cookie, redirects to `/login`
3. User logs in via passkey or magic link
4. Callback/ceremony handler reads cookie, clears it, redirects to original path
5. Direct `/login` visits (no cookie) redirect to `afterLogin` default

## What Changed from Original README

- Login UX: email-first with method choice
- Client architecture: thin `AuthProvider` + `AuthGuard` layout wrapper
- Route integration: plugin instead of manual wiring
- Redirect handling: cookie-based redirect-back flow
- UI: default Joy components with slot overrides

## What Stayed the Same

- Role management (`setRole`, `setRoles`)
- Role grant rules (`roleGrants`)
- Impersonation (`impersonate`, `isImpersonating`)
- Email templates (react-email overrides)
- Schema tables (user, session, passkey, role, impersonation_log)
- Session config
