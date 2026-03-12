# Documentation Website Design

## Summary

A documentation website for CFast built with Astro + Starlight, hosted at `docs/website/` as the `@cfast/docs` workspace package. Combines hand-written guides with auto-generated API reference from TypeDoc.

## Stack

- **Astro + Starlight** — static docs site generator
- **starlight-typedoc** — generates API reference pages from TSDoc comments in source
- **Playwright** — E2E tests for tutorial step projects

## Site Structure

```
/                        → Landing page (hero, feature grid, install CTA)
/getting-started/        → Top-level getting started guide
/guides/{package}/       → Per-package quickstart + overview
/tutorial/               → Step-by-step team blog tutorial
/api/{package}/          → Auto-generated TypeDoc API reference
```

### Landing Page

Clean, technical landing page built from existing README content:
- Hero with tagline ("Skip the boring parts. Build your Cloudflare Workers app.")
- Feature grid showing the packages grouped by category (Core, UI & DX, Tooling)
- Quick install command (`npm create cfast@latest my-app`)
- CTAs into Getting Started and Tutorial

### Getting Started

Top-level guide covering:
- Prerequisites (Node 20+, pnpm, Cloudflare account)
- Installation and project setup
- Basic configuration (env, db, first route)
- "Hello world" that touches env + db + a simple route
- Points to tutorial for the full experience

### Per-Package Guides

Each of the 12 packages (skip `create-cfast`) gets a guide page:
- Overview (from README)
- Installation and setup
- Core concepts and usage examples
- Common patterns
- Links to API reference

### Tutorial: Build a Team Blog

Step-by-step tutorial building a team blog from scratch. Each step is a complete, runnable project snapshot in `docs/tutorials/team-blog/`:

```
docs/tutorials/team-blog/
  step-01-setup/         → Project init, wrangler config, first route
  step-02-database/      → D1, Drizzle schema, env bindings
  step-03-auth/          → Authentication with Better Auth
  step-04-permissions/   → Roles and permission rules
  step-05-crud/          → Actions, forms, CRUD routes
  step-06-admin/         → Auto-generated admin panel
  step-07-storage/       → File uploads with R2
  step-08-email/         → Email notifications
```

Each step:
- Is a complete runnable project with its own `package.json`
- Has Playwright E2E tests validating the tutorial claims
- Tutorial MDX pages reference code from these step projects

### API Reference

Auto-generated from TypeDoc via `starlight-typedoc`:
- One section per package under `/api/{package}/`
- Generated from TSDoc comments on all public exports
- Includes type signatures, parameter descriptions, return types, examples

## TSDoc Coverage

Add TSDoc comments to all public exports across 12 packages (skip `create-cfast` — not yet implemented):

Required annotations per public export:
- One-line description
- `@param` tags for function parameters
- `@returns` description
- `@example` with usage snippet for main functions (`createX`, `defineX`, `useX`)

Packages in dependency order:
1. `env`
2. `permissions`
3. `core`
4. `db`
5. `auth`
6. `storage`
7. `actions`
8. `ui`
9. `forms`
10. `email`
11. `pagination`
12. `admin`

## Infrastructure

### Workspace Integration

- `docs/website/` added as workspace package `@cfast/docs`
- `pnpm-workspace.yaml` updated to include `docs/website`
- `turbo.json` gets `docs:dev` and `docs:build` tasks

### Commands

- `pnpm docs:dev` — serve docs locally via Starlight dev server
- `pnpm docs:build` — produce static output for GitHub Pages

### GitHub Pages

Static output goes to `docs/website/dist/`. GitHub Pages deployment will be configured later by the user.

## Agent Updates

### `api-reviewer.md`

Add TSDoc completeness check:
- Every public export must have a TSDoc comment
- Functions must have `@param`, `@returns`
- Main factory/hook functions must have `@example`

### `example-sync.md`

Expand scope to also check tutorial step projects:
- Check `docs/tutorials/team-blog/step-*/` in addition to `examples/team-blog-after`
- Verify tutorial steps use current package APIs

### `CLAUDE.md`

Update agent table descriptions to reflect new responsibilities.

## Non-Goals

- No `create-cfast` docs (not implemented yet)
- No CI deployment pipeline (user will set up GitHub Pages later)
- No versioned docs (single version for now)
- No i18n
