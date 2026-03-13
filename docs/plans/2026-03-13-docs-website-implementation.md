# Documentation Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Starlight documentation website with API reference, getting started guides, a testable team blog tutorial, and a landing page.

**Architecture:** Astro + Starlight site at `docs/website/` as `@cfast/docs` workspace package. TypeDoc auto-generates API reference from TSDoc comments. Tutorial steps are full project snapshots in `docs/tutorials/team-blog/step-NN-*/` with E2E tests. Hand-written MDX for guides and tutorial narrative.

**Tech Stack:** Astro 5, Starlight, starlight-typedoc, TypeDoc, Playwright (tutorial E2E)

---

### Task 1: Scaffold Starlight Site

**Files:**
- Create: `docs/website/package.json`
- Create: `docs/website/astro.config.mjs`
- Create: `docs/website/tsconfig.json`
- Create: `docs/website/src/content.config.ts`
- Create: `docs/website/src/assets/cfast-logo.svg`
- Modify: `pnpm-workspace.yaml`
- Modify: `turbo.json`
- Modify: `package.json` (root)

**Step 1: Update workspace config to include docs site**

In `pnpm-workspace.yaml`, add `docs/website`:
```yaml
packages:
  - "packages/*"
  - "examples/*"
  - "docs/website"
```

**Step 2: Create `docs/website/package.json`**

```json
{
  "name": "@cfast/docs",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.34",
    "astro": "^5",
    "sharp": "^0.34",
    "starlight-typedoc": "^0.22",
    "typedoc": "^0.28",
    "typedoc-plugin-markdown": "^4"
  }
}
```

**Step 3: Create `docs/website/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

**Step 4: Create `docs/website/astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  integrations: [
    starlight({
      title: "CFast",
      description:
        "Composable TypeScript libraries for Cloudflare Workers + React Router + Drizzle ORM.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/danielschmidt/cfast",
        },
      ],
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Tutorial: Build a Team Blog",
          autogenerate: { directory: "tutorial" },
        },
        typeDocSidebarGroup,
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../../packages/env/src/index.ts",
            "../../packages/permissions/src/index.ts",
            "../../packages/core/src/index.ts",
            "../../packages/db/src/index.ts",
            "../../packages/auth/src/index.ts",
            "../../packages/storage/src/index.ts",
            "../../packages/actions/src/index.ts",
            "../../packages/ui/src/index.ts",
            "../../packages/forms/src/index.ts",
            "../../packages/email/src/index.ts",
            "../../packages/pagination/src/index.ts",
            "../../packages/admin/src/index.ts",
          ],
          tsconfig: "../../tsconfig.base.json",
          output: "api",
          sidebar: {
            label: "API Reference",
            collapsed: true,
          },
          typeDoc: {
            entryPointStrategy: "packages",
            packageOptions: {
              entryPoints: ["src/index.ts"],
            },
          },
        }),
      ],
    }),
  ],
});
```

Note: The exact `starlightTypeDoc` config may need adjustment based on the monorepo structure. The `entryPointStrategy: "packages"` approach treats each entry point as a separate package. Test this during Step 7 and adjust.

**Step 5: Create `docs/website/src/content.config.ts`**

```ts
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

**Step 6: Create a simple SVG logo placeholder**

Create `docs/website/src/assets/cfast-logo.svg` — a simple text-based SVG with "CFast" in a monospace font. This is a placeholder; can be replaced later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
  <text x="10" y="28" font-family="monospace" font-size="24" font-weight="bold" fill="currentColor">CFast</text>
</svg>
```

**Step 7: Add turbo tasks and root scripts**

In `turbo.json`, add docs tasks:
```json
{
  "tasks": {
    "docs:dev": {
      "cache": false,
      "persistent": true
    },
    "docs:build": {
      "dependsOn": ["^build"],
      "outputs": ["docs/website/dist/**"]
    }
  }
}
```

In root `package.json`, add scripts:
```json
{
  "scripts": {
    "docs:dev": "pnpm --filter @cfast/docs dev",
    "docs:build": "pnpm --filter @cfast/docs build",
    "docs:preview": "pnpm --filter @cfast/docs preview"
  }
}
```

**Step 8: Install dependencies and verify dev server starts**

```bash
cd docs/website && pnpm install
pnpm docs:dev
```

Visit localhost:4321 and verify the Starlight skeleton loads.

**Step 9: Commit**

```bash
git add docs/website/ pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml
git commit -m "feat(docs): scaffold Starlight documentation site"
```

---

### Task 2: Landing Page

**Files:**
- Create: `docs/website/src/content/docs/index.mdx`

**Step 1: Create the landing page**

Create `docs/website/src/content/docs/index.mdx`:

```mdx
---
title: CFast
description: Composable TypeScript libraries for Cloudflare Workers + React Router + Drizzle ORM.
template: splash
hero:
  tagline: Skip the boring parts. Build your Cloudflare Workers app.
  actions:
    - text: Get Started
      link: /getting-started/
      icon: right-arrow
      variant: primary
    - text: Tutorial
      link: /tutorial/01-setup/
      variant: minimal
---

import { Card, CardGrid } from "@astrojs/starlight/components";

## The Stack

CFast is built around a specific, proven stack — Cloudflare Workers, React Router v7, Drizzle ORM on D1, Better Auth, and MUI Joy UI. It is opinionated where it matters and invisible where it doesn't.

## Core

<CardGrid>
  <Card title="@cfast/env" icon="setting">
    Type-safe Cloudflare bindings with runtime validation
  </Card>
  <Card title="@cfast/permissions" icon="approve-check">
    Isomorphic permission system with Drizzle-native row-level access control
  </Card>
  <Card title="@cfast/auth" icon="open-book">
    Authentication: magic email, passkeys, role management, impersonation
  </Card>
  <Card title="@cfast/db" icon="document">
    Permission-aware Drizzle queries for D1
  </Card>
  <Card title="@cfast/storage" icon="cloud-upload">
    Schema-driven file uploads to R2 with multipart support
  </Card>
  <Card title="@cfast/core" icon="puzzle">
    Plugin system that wires everything together
  </Card>
</CardGrid>

## UI & Developer Experience

<CardGrid>
  <Card title="@cfast/actions" icon="rocket">
    Multi-action routes and permission-aware action definitions
  </Card>
  <Card title="@cfast/ui" icon="laptop">
    Permission-aware component wrappers (ActionButton, PermissionGate)
  </Card>
  <Card title="@cfast/forms" icon="list-format">
    Auto-generated forms from Drizzle schema
  </Card>
  <Card title="@cfast/pagination" icon="right-arrow">
    Cursor-based, offset-based pagination and infinite scroll
  </Card>
  <Card title="@cfast/admin" icon="star">
    Auto-generated admin UI from your Drizzle schema
  </Card>
  <Card title="@cfast/email" icon="email">
    Plugin-based email with react-email rendering
  </Card>
</CardGrid>

## Quick Start

```bash
npm create cfast@latest my-app
```

## Philosophy

1. **Permissions are first-class.** Define them once. Enforce on the server. Reflect in the UI.
2. **The database drives the UI.** Your Drizzle schema is the source of truth.
3. **Common patterns, not configuration.** Multi-action routes, infinite scroll, pagination, auth — solved once, correctly.
4. **Isomorphic by design.** Permission checks, validation, and data types work identically on client and server.
```

**Step 2: Verify the landing page renders**

```bash
pnpm docs:dev
```

Check localhost:4321 — verify hero, cards, and quick start render correctly.

**Step 3: Commit**

```bash
git add docs/website/src/content/docs/index.mdx
git commit -m "feat(docs): add landing page"
```

---

### Task 3: Getting Started Guide

**Files:**
- Create: `docs/website/src/content/docs/getting-started.mdx`

**Step 1: Write the getting started guide**

Create `docs/website/src/content/docs/getting-started.mdx`. Content should cover:

1. Prerequisites — Node 20+, pnpm, Cloudflare account, wrangler CLI
2. Create a new project — `npm create cfast@latest my-app` (mention this is coming soon, with manual setup instructions below)
3. Manual project setup — init pnpm project, install core packages, configure wrangler.jsonc, create D1 database
4. Configure environment — `defineEnv()` with D1 binding
5. Define schema — simple Drizzle table
6. Set up auth — `createAuth()` with magic email
7. Create first route — React Router route that queries D1
8. Run locally — `wrangler dev`
9. Next steps — links to per-package guides and tutorial

Pull from the existing README for the stack description. Reference `@cfast/env` README for env setup patterns, `@cfast/db` README for schema patterns. Keep code examples minimal and self-contained.

**Step 2: Verify it renders and navigation works**

```bash
pnpm docs:dev
```

**Step 3: Commit**

```bash
git add docs/website/src/content/docs/getting-started.mdx
git commit -m "feat(docs): add getting started guide"
```

---

### Task 4: Per-Package Guide Pages

**Files:**
- Create: `docs/website/src/content/docs/guides/env.mdx`
- Create: `docs/website/src/content/docs/guides/permissions.mdx`
- Create: `docs/website/src/content/docs/guides/core.mdx`
- Create: `docs/website/src/content/docs/guides/db.mdx`
- Create: `docs/website/src/content/docs/guides/auth.mdx`
- Create: `docs/website/src/content/docs/guides/storage.mdx`
- Create: `docs/website/src/content/docs/guides/actions.mdx`
- Create: `docs/website/src/content/docs/guides/ui.mdx`
- Create: `docs/website/src/content/docs/guides/forms.mdx`
- Create: `docs/website/src/content/docs/guides/email.mdx`
- Create: `docs/website/src/content/docs/guides/pagination.mdx`
- Create: `docs/website/src/content/docs/guides/admin.mdx`

**Step 1: Create guide pages for each package**

Each guide page follows this structure:
```mdx
---
title: "@cfast/{name}"
description: "{one-line description from README}"
---

## Overview
{Summary from README — what the package does and why}

## Installation
{Package install command and peer dependencies}

## Quick Setup
{Minimal code to get it working — from README examples}

## Core Concepts
{Key concepts specific to this package — from README}

## Common Patterns
{2-3 practical usage patterns — from README examples}

## API Reference
See the [full API reference](/api/{name}/) for detailed type signatures.
```

Content for each guide should be derived from the corresponding `packages/{name}/README.md`. Read each README and adapt the content into the guide format. Do NOT copy READMEs verbatim — restructure for a docs-site reading experience.

This task can be parallelized: dispatch one subagent per 3-4 packages.

**Step 2: Verify all guide pages render and sidebar navigation works**

```bash
pnpm docs:dev
```

**Step 3: Commit**

```bash
git add docs/website/src/content/docs/guides/
git commit -m "feat(docs): add per-package guide pages"
```

---

### Task 5: Add TSDoc Comments — Leaf Packages (env, permissions)

**Files:**
- Modify: `packages/env/src/define-env.ts`
- Modify: `packages/env/src/types.ts`
- Modify: `packages/env/src/validators.ts`
- Modify: `packages/env/src/errors.ts`
- Modify: `packages/permissions/src/define-permissions.ts`
- Modify: `packages/permissions/src/check.ts`
- Modify: `packages/permissions/src/grant.ts`
- Modify: `packages/permissions/src/resolve-grants.ts`
- Modify: `packages/permissions/src/types.ts`
- Modify: `packages/permissions/src/errors.ts`
- Modify: `packages/permissions/src/client.ts`

**Step 1: Add TSDoc to all public exports in `@cfast/env`**

For every `export function`, `export type`, `export const`, `export class`:
- Add a one-line description
- Add `@param` for function parameters
- Add `@returns` for functions
- Add `@example` for `defineEnv()` and `EnvError`

Read each source file, identify public exports, and add TSDoc comments directly above them. Do not modify any logic.

**Step 2: Add TSDoc to all public exports in `@cfast/permissions`**

Same approach. Key exports to document:
- `definePermissions()` — needs `@example` showing role + grant setup
- `grant()` — needs `@example`
- `checkPermissions()` — needs `@example`
- `resolveGrants()`, `getTableName()`, `CRUD_ACTIONS`
- All exported types: `PermissionAction`, `Grant`, `GrantFn`, `Permissions`, etc.
- `ForbiddenError` class
- Client exports in `client.ts`

**Step 3: Verify typecheck passes**

```bash
pnpm --filter @cfast/env typecheck && pnpm --filter @cfast/permissions typecheck
```

**Step 4: Commit**

```bash
git add packages/env/src/ packages/permissions/src/
git commit -m "docs: add TSDoc comments to @cfast/env and @cfast/permissions"
```

---

### Task 6: Add TSDoc Comments — Core + Data Layer (core, db, auth)

**Files:**
- Modify: all `.ts`/`.tsx` files in `packages/core/src/`
- Modify: all `.ts` files in `packages/db/src/`
- Modify: all `.ts`/`.tsx` files in `packages/auth/src/`

**Step 1: Add TSDoc to `@cfast/core` public exports**

Key exports:
- `createApp()` — `@example` with plugin registration
- `definePlugin()` — `@example` with a simple plugin
- `useApp()` — `@example` in a React component
- `createCoreProvider()` — `@example`
- All types: `CfastPlugin`, `CreateAppConfig`, `PluginSetupContext`, `AppContext`, etc.
- Error classes: `CfastPluginError`, `CfastConfigError`

**Step 2: Add TSDoc to `@cfast/db` public exports**

Key exports (many functions — focus on the main ones with `@example`):
- `createDb()` — `@example` with D1 + permissions
- `compose()` — `@example` composing query options
- `parseCursorParams()`, `parseOffsetParams()` — `@example` with URL params
- `createQueryBuilder()`, `createInsertBuilder()`, `createUpdateBuilder()`, `createDeleteBuilder()`
- All pagination types: `CursorParams`, `OffsetParams`, `CursorPage`, `OffsetPage`
- All builder types

**Step 3: Add TSDoc to `@cfast/auth` public exports**

Key exports across 4 entry points:
- Main: `createAuth()`, `createRoleManager()`, `createImpersonationManager()`, `createAuthRouteHandlers()`
- Client: `AuthProvider`, `useCurrentUser`, `useLoginPath`, `AuthGuard`, `AuthClientProvider`, `useAuth`, `LoginPage`, `createAuthClient`
- Plugin: `authRoutes()`
- Schema: all Drizzle table exports
- All types

**Step 4: Verify typecheck passes**

```bash
pnpm --filter @cfast/core typecheck && pnpm --filter @cfast/db typecheck && pnpm --filter @cfast/auth typecheck
```

**Step 5: Commit**

```bash
git add packages/core/src/ packages/db/src/ packages/auth/src/
git commit -m "docs: add TSDoc comments to @cfast/core, @cfast/db, and @cfast/auth"
```

---

### Task 7: Add TSDoc Comments — Storage, Actions, Email

**Files:**
- Modify: all `.ts`/`.tsx` files in `packages/storage/src/`
- Modify: all `.ts`/`.tsx` files in `packages/actions/src/`
- Modify: all `.ts` files in `packages/email/src/`

**Step 1: Add TSDoc to `@cfast/storage`**

Key exports:
- `defineStorage()` — `@example`
- `filetype()` — `@example`
- Client: `StorageProvider`, `useStorageConfig`, `useUpload` — `@example` for `useUpload`
- Validation functions, MIME detection helpers
- All types

**Step 2: Add TSDoc to `@cfast/actions`**

Key exports:
- `createActions()` — `@example` with permission-aware actions
- `checkPermissionStatus()` — `@example`
- Client: `useActions()` — `@example` in a React component
- `clientDescriptor()` — `@example`
- All types

**Step 3: Add TSDoc to `@cfast/email`**

Key exports across 3 entry points:
- Main: `createEmailClient()` — `@example`, `EmailDeliveryError`
- Mailgun: `mailgun()` — `@example`
- Console: `console()` — `@example`
- All types

**Step 4: Verify typecheck passes**

```bash
pnpm --filter @cfast/storage typecheck && pnpm --filter @cfast/actions typecheck && pnpm --filter @cfast/email typecheck
```

**Step 5: Commit**

```bash
git add packages/storage/src/ packages/actions/src/ packages/email/src/
git commit -m "docs: add TSDoc comments to @cfast/storage, @cfast/actions, and @cfast/email"
```

---

### Task 8: Add TSDoc Comments — UI Layer (ui, forms, pagination, admin)

**Files:**
- Modify: public-facing `.ts`/`.tsx` files in `packages/ui/src/`
- Modify: all `.ts`/`.tsx` files in `packages/forms/src/`
- Modify: all `.ts` files in `packages/pagination/src/`
- Modify: all `.ts`/`.tsx` files in `packages/admin/src/`

**Step 1: Add TSDoc to `@cfast/ui`**

This is the largest package. Focus on:
- Plugin API: `createUIPlugin()`, `UIPluginProvider()`, `useUIPlugin()`, `useComponent()`
- Hooks: `useConfirm()`, `useToast()`, `useActionToast()`, `useColumnInference()`
- Core headless components: `PermissionGate`, `ActionButton`, `ConfirmProvider`, `DataTable`, `AppShell`, etc.
- Field components: `DateField`, `BooleanField`, `NumberField`, `TextField`, etc., `fieldForColumn()`, `fieldsForTable()`
- Types in `types.ts`
- Do NOT add TSDoc to Joy UI implementations (`./joy` entrypoint) or story files — these are implementation details

**Step 2: Add TSDoc to `@cfast/forms`**

Key exports:
- `introspectTable()` — `@example`
- `createResolver()` — `@example`
- `createFormPlugin()` — `@example`
- `createAutoForm()` — `@example`
- `v()` validation — `@example`
- All types

**Step 3: Add TSDoc to `@cfast/pagination`**

Key exports (all React hooks):
- `usePagination()` — `@example` with cursor pagination
- `useInfiniteScroll()` — `@example`
- `useOffsetPagination()` — `@example`
- All types

**Step 4: Add TSDoc to `@cfast/admin`**

Key exports:
- `createAdmin()` — `@example` with basic config
- `introspectSchema()`, `createAdminLoader()`, `createAdminAction()`, `createAdminComponent()`
- Utility functions: `tableNameToLabel()`, `columnNameToLabel()`, `parseAdminParams()`, `buildAdminUrl()`
- All types

**Step 5: Verify typecheck passes for all four packages**

```bash
pnpm --filter @cfast/ui typecheck && pnpm --filter @cfast/forms typecheck && pnpm --filter @cfast/pagination typecheck && pnpm --filter @cfast/admin typecheck
```

**Step 6: Commit**

```bash
git add packages/ui/src/ packages/forms/src/ packages/pagination/src/ packages/admin/src/
git commit -m "docs: add TSDoc comments to @cfast/ui, @cfast/forms, @cfast/pagination, and @cfast/admin"
```

---

### Task 9: TypeDoc Integration — Verify API Reference Generation

**Files:**
- Possibly modify: `docs/website/astro.config.mjs` (adjust TypeDoc config if needed)

**Step 1: Build the docs site and verify TypeDoc output**

```bash
pnpm docs:build
```

Check the build output for TypeDoc-generated pages under `api/`. If the build fails, adjust the `starlightTypeDoc` config in `astro.config.mjs`:

Common issues to fix:
- Entry point paths may need adjustment (check if packages use `src/index.ts` vs barrel exports)
- `tsconfig` path may need to point to individual package tsconfigs
- `entryPointStrategy` may need to be `"resolve"` instead of `"packages"`

Iterate until `pnpm docs:build` succeeds and the API reference pages are generated.

**Step 2: Verify API pages in dev mode**

```bash
pnpm docs:dev
```

Navigate to `/api/` and verify each package has generated API docs with the TSDoc content.

**Step 3: Commit any config adjustments**

```bash
git add docs/website/
git commit -m "fix(docs): adjust TypeDoc configuration for monorepo"
```

---

### Task 10: Tutorial Step 1 — Project Setup

**Files:**
- Create: `docs/tutorials/team-blog/step-01-setup/package.json`
- Create: `docs/tutorials/team-blog/step-01-setup/wrangler.jsonc`
- Create: `docs/tutorials/team-blog/step-01-setup/tsconfig.json`
- Create: `docs/tutorials/team-blog/step-01-setup/app/root.tsx`
- Create: `docs/tutorials/team-blog/step-01-setup/app/routes/home.tsx`
- Create: `docs/tutorials/team-blog/step-01-setup/app/routes.ts`
- Create: `docs/tutorials/team-blog/step-01-setup/react-router.config.ts`
- Create: `docs/tutorials/team-blog/step-01-setup/e2e/setup.spec.ts`
- Create: `docs/tutorials/team-blog/step-01-setup/playwright.config.ts`
- Create: `docs/website/src/content/docs/tutorial/01-setup.mdx`

**Step 1: Create the step-01 project**

A minimal React Router v7 app on Cloudflare Workers:
- `package.json` with `react-router`, `@react-router/dev`, `@react-router/cloudflare`, `wrangler` deps
- `wrangler.jsonc` with Workers config and D1 binding placeholder
- `tsconfig.json` extending the base
- `react-router.config.ts` with Cloudflare preset
- `app/root.tsx` with basic HTML shell
- `app/routes.ts` with a home route
- `app/routes/home.tsx` returning a simple "Team Blog" heading

**Step 2: Add Playwright E2E test**

`e2e/setup.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Team Blog" })).toBeVisible();
});
```

`playwright.config.ts` configured to run against `wrangler dev` or a build preview.

**Step 3: Write the tutorial MDX page**

Create `docs/website/src/content/docs/tutorial/01-setup.mdx` explaining:
- What we're building (a team blog with auth, permissions, admin)
- Prerequisites
- Creating the project from scratch
- Each file and why it exists
- Running the app

Reference code from `docs/tutorials/team-blog/step-01-setup/` files using relative imports or code blocks.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-01-setup/ docs/website/src/content/docs/tutorial/01-setup.mdx
git commit -m "feat(docs): add tutorial step 1 — project setup"
```

---

### Task 11: Tutorial Step 2 — Database

**Files:**
- Create: `docs/tutorials/team-blog/step-02-database/` (full project copy from step-01, plus changes)
- Create: `docs/tutorials/team-blog/step-02-database/e2e/database.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/02-database.mdx`

**Step 1: Create step-02 project**

Copy step-01 as base, then add:
- `@cfast/env` and `@cfast/db` as dependencies
- `app/schema.ts` — Drizzle schema with `posts` and `users` tables
- `app/env.server.ts` — `defineEnv()` with D1 binding
- `app/db.server.ts` — `createDb()` setup
- Update `app/routes/home.tsx` to query posts from D1
- `drizzle.config.ts` for migrations

**Step 2: Add E2E test**

Test that the home page loads and shows "No posts yet" or a posts list.

**Step 3: Write tutorial MDX**

Explain D1, Drizzle, `defineEnv()`, `createDb()`, and the schema.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-02-database/ docs/website/src/content/docs/tutorial/02-database.mdx
git commit -m "feat(docs): add tutorial step 2 — database setup"
```

---

### Task 12: Tutorial Step 3 — Auth

**Files:**
- Create: `docs/tutorials/team-blog/step-03-auth/` (full project from step-02, plus auth)
- Create: `docs/tutorials/team-blog/step-03-auth/e2e/auth.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/03-auth.mdx`

**Step 1: Create step-03 project**

Add to step-02:
- `@cfast/auth` dependency
- Auth schema tables (from `@cfast/auth/schema`)
- `app/auth.server.ts` — `createAuth()` with magic email
- Auth route handlers
- Login page using `LoginPage` component
- Protected home route using `AuthGuard`
- Auth client provider in root

**Step 2: Add E2E test**

Test that unauthenticated users see login page, and the login form renders.

**Step 3: Write tutorial MDX**

Explain Better Auth, magic email, `createAuth()`, auth routes, client provider.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-03-auth/ docs/website/src/content/docs/tutorial/03-auth.mdx
git commit -m "feat(docs): add tutorial step 3 — authentication"
```

---

### Task 13: Tutorial Step 4 — Permissions

**Files:**
- Create: `docs/tutorials/team-blog/step-04-permissions/`
- Create: `docs/tutorials/team-blog/step-04-permissions/e2e/permissions.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/04-permissions.mdx`

**Step 1: Create step-04 project**

Add to step-03:
- `@cfast/permissions` dependency
- `app/permissions.ts` — `definePermissions()` with roles (admin, editor, reader)
- Permission grants for posts CRUD based on roles
- Row-level access: editors can only edit their own posts
- Update `createDb()` to include permissions
- Update routes to use permission-aware queries

**Step 2: Add E2E test**

Test that permission rules are enforced (e.g., non-author can't see edit button).

**Step 3: Write tutorial MDX**

Explain the permission model, roles, grants, row-level access, isomorphic checks.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-04-permissions/ docs/website/src/content/docs/tutorial/04-permissions.mdx
git commit -m "feat(docs): add tutorial step 4 — permissions"
```

---

### Task 14: Tutorial Step 5 — CRUD with Actions

**Files:**
- Create: `docs/tutorials/team-blog/step-05-crud/`
- Create: `docs/tutorials/team-blog/step-05-crud/e2e/crud.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/05-crud.mdx`

**Step 1: Create step-05 project**

Add to step-04:
- `@cfast/actions`, `@cfast/ui`, `@cfast/forms` dependencies
- `app/routes/posts/index.tsx` — list posts with DataTable
- `app/routes/posts/new.tsx` — create post with AutoForm
- `app/routes/posts/$id.tsx` — view/edit post
- Multi-action route with `createActions()`
- Permission-aware `ActionButton` and `PermissionGate`

**Step 2: Add E2E test**

Test creating a post, viewing the list, editing a post.

**Step 3: Write tutorial MDX**

Explain actions, forms, UI components, multi-action routes.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-05-crud/ docs/website/src/content/docs/tutorial/05-crud.mdx
git commit -m "feat(docs): add tutorial step 5 — CRUD with actions and forms"
```

---

### Task 15: Tutorial Step 6 — Admin Panel

**Files:**
- Create: `docs/tutorials/team-blog/step-06-admin/`
- Create: `docs/tutorials/team-blog/step-06-admin/e2e/admin.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/06-admin.mdx`

**Step 1: Create step-06 project**

Add to step-05:
- `@cfast/admin` dependency
- `app/routes/admin.tsx` — `createAdmin()` with schema introspection
- Admin route configuration
- Table overrides for posts and users

**Step 2: Add E2E test**

Test that admin panel renders, shows tables, and basic CRUD works.

**Step 3: Write tutorial MDX**

Explain `createAdmin()`, schema introspection, customization.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-06-admin/ docs/website/src/content/docs/tutorial/06-admin.mdx
git commit -m "feat(docs): add tutorial step 6 — admin panel"
```

---

### Task 16: Tutorial Step 7 — File Storage

**Files:**
- Create: `docs/tutorials/team-blog/step-07-storage/`
- Create: `docs/tutorials/team-blog/step-07-storage/e2e/storage.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/07-storage.mdx`

**Step 1: Create step-07 project**

Add to step-06:
- `@cfast/storage` dependency
- `app/storage.server.ts` — `defineStorage()` with post cover images
- R2 binding in wrangler.jsonc
- Update post form to include image upload via `useUpload()`
- `DropZone` component for drag-and-drop

**Step 2: Add E2E test**

Test that file upload UI renders and accepts files.

**Step 3: Write tutorial MDX**

Explain `defineStorage()`, `filetype()`, R2, upload hooks, client components.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-07-storage/ docs/website/src/content/docs/tutorial/07-storage.mdx
git commit -m "feat(docs): add tutorial step 7 — file storage"
```

---

### Task 17: Tutorial Step 8 — Email

**Files:**
- Create: `docs/tutorials/team-blog/step-08-email/`
- Create: `docs/tutorials/team-blog/step-08-email/e2e/email.spec.ts`
- Create: `docs/website/src/content/docs/tutorial/08-email.mdx`

**Step 1: Create step-08 project**

Add to step-07:
- `@cfast/email` dependency
- `app/email.server.ts` — `createEmailClient()` with console provider (dev)
- Email notification when a new post is published
- React-email template for the notification

**Step 2: Add E2E test**

Test that publishing a post triggers the email flow (console provider logs it).

**Step 3: Write tutorial MDX**

Explain `createEmailClient()`, providers, react-email templates.

**Step 4: Commit**

```bash
git add docs/tutorials/team-blog/step-08-email/ docs/website/src/content/docs/tutorial/08-email.mdx
git commit -m "feat(docs): add tutorial step 8 — email notifications"
```

---

### Task 18: Update Agents and CLAUDE.md

**Files:**
- Modify: `.claude/agents/api-reviewer.md`
- Modify: `.claude/agents/example-sync.md`
- Modify: `CLAUDE.md`

**Step 1: Update `api-reviewer.md`**

Add a new section "### TSDoc Coverage" to the "## What to Check" section:

```markdown
### TSDoc Coverage
- Every public export (`export function`, `export type`, `export const`, `export class`) must have a TSDoc comment
- Functions must have `@param` tags for all parameters and a `@returns` tag
- Main factory functions (`createX`), schema functions (`defineX`), and hooks (`useX`) must have an `@example` tag
- Error classes must have a TSDoc description
- Types used in public APIs must have a TSDoc description
```

Add to the Process section step 3.5:
```markdown
3.5. Check TSDoc coverage on all public exports found in step 3. Flag missing or incomplete TSDoc.
```

**Step 2: Update `example-sync.md`**

Add to the Process section after step 2:

```markdown
### 2b. Find Usage in Tutorial Steps

Search `docs/tutorials/team-blog/step-*/` for:
- Imports from the changed package (`@cfast/<package>`)
- Usage of the package's API
- Patterns that the package is meant to replace

Tutorial steps that import the changed package should be using the latest API.
```

Update the Report section to mention tutorial steps:
```markdown
For each issue found (in the example app or tutorial steps):
```

Update the Notes section:
```markdown
- Also check tutorial step projects in `docs/tutorials/team-blog/`. Each step is a complete project that should use current APIs for the packages it imports.
```

**Step 3: Update `CLAUDE.md`**

Update the agent table to reflect new responsibilities:

| Agent | Model | When to Run |
|---|---|---|
| `api-reviewer.md` | Sonnet | After adding/changing any public API — also checks TSDoc coverage |
| `workers-compat.md` | Haiku | After adding deps or writing code that might use Node.js APIs |
| `package-boundary.md` | Haiku | After changing dependencies between packages or adding exports |
| `readme-sync.md` | Sonnet | After implementing features to verify code matches documented API |
| `deps-checker.md` | Haiku | After adding/changing dependencies or periodically to check freshness |
| `example-sync.md` | Sonnet | After implementing/changing any @cfast/* package — verifies `examples/team-blog-after` and `docs/tutorials/` use the latest APIs |

Also add to the Code Style section:
```markdown
- All public exports must have TSDoc comments (`@param`, `@returns`, `@example` for main functions). The `api-reviewer` agent enforces this.
```

Also add to the Commands section:
```bash
pnpm docs:dev     # Serve documentation site locally
pnpm docs:build   # Build documentation site for deployment
```

**Step 4: Commit**

```bash
git add .claude/agents/api-reviewer.md .claude/agents/example-sync.md CLAUDE.md
git commit -m "docs: update agents and CLAUDE.md for TSDoc and tutorial checks"
```

---

### Task 19: Final Build Verification

**Step 1: Full docs build**

```bash
pnpm docs:build
```

Verify no errors. Check that:
- Landing page renders
- Getting started guide is navigable
- All 12 per-package guides appear in sidebar
- All 8 tutorial steps appear in sidebar
- API reference has pages for all 12 packages with TSDoc content

**Step 2: Preview the built site**

```bash
pnpm docs:preview
```

Click through all pages and verify links work.

**Step 3: Run typecheck across all packages**

```bash
pnpm typecheck
```

Verify TSDoc additions didn't break anything.

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(docs): address build issues from final verification"
```

---

## Execution Notes

### Parallelization Opportunities

These tasks can run in parallel:
- **Tasks 5, 6, 7, 8** (TSDoc for different package groups) — completely independent
- **Tasks 10-17** (tutorial steps) — each step depends on the previous, but the MDX writing can be parallelized with step project creation
- **Task 4** (per-package guides) — can dispatch one subagent per 3-4 packages

### Dependencies

```
Task 1 (scaffold) → Task 2 (landing) → Task 3 (getting started)
Task 1 → Task 4 (guides)
Tasks 5-8 (TSDoc) → Task 9 (TypeDoc verification)
Task 1 → Tasks 10-17 (tutorial steps, sequential)
Tasks 5-8 + Task 9 + Tasks 10-17 → Task 19 (final verification)
Task 18 (agents) is independent
```

### Estimated Scope

- ~120 public functions need TSDoc
- ~300 types need TSDoc
- 12 guide pages
- 8 tutorial step projects + 8 MDX pages
- 1 landing page, 1 getting started guide
- 3 files to update for agents
