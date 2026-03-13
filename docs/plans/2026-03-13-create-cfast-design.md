# create-cfast Design

## Overview

`create-cfast` is a CLI scaffolder that generates a fully wired Cloudflare Workers + React Router project using the `@cfast/*` packages. It uses file-based templates with a base + feature overlay system and a pipeline architecture.

## CLI Interface

```bash
# Interactive
pnpm create cfast

# Non-interactive (flags skip corresponding prompts)
pnpm create cfast my-app --auth --db --ui --email --storage --admin

# All features
pnpm create cfast my-app --all
```

### Prompts (in order)

1. **Project name** — defaults to current directory name or `my-cfast-app`
2. **Features** — multi-select checklist: `auth`, `db`, `storage`, `email`, `ui`, `admin`
3. **UI library** (only if `ui` selected) — `joy` (MUI Joy UI) or `headless`

### Resolved Config

```typescript
type Config = {
  projectName: string
  targetDir: string
  features: {
    auth: boolean
    db: boolean
    storage: boolean
    email: boolean
    ui: boolean
    admin: boolean
  }
  uiLibrary: 'joy' | 'headless' | null
}
```

## Architecture: Pipeline

```
parseArgs(process.argv)
  → promptForMissing(args)
  → resolveConfig(answers)
  → scaffold(config)
  → printNextSteps(config)
```

Each step is a pure function. The resolved config object flows through the pipeline.

## Template System

### File-based templates with overlays

```
templates/
├── base/                 # Always included — minimal working app
│   ├── app/
│   │   ├── routes/_index.tsx
│   │   ├── env.ts
│   │   ├── cfast.server.ts
│   │   ├── entry.server.tsx
│   │   ├── root.tsx
│   │   └── routes.ts
│   ├── workers/app.ts
│   ├── package.json
│   ├── wrangler.toml
│   ├── vite.config.ts
│   ├── react-router.config.ts
│   ├── tsconfig.json
│   └── .gitignore
├── db/                   # D1 + Drizzle overlay
│   ├── app/db/schema.ts
│   ├── drizzle.config.ts
│   ├── package.json      # Fragment
│   └── wrangler.toml     # Fragment
├── auth/                 # Better Auth overlay
│   ├── app/routes/login.tsx
│   ├── app/routes/auth.$.tsx
│   ├── app/auth.setup.server.ts
│   ├── app/auth.client.ts
│   ├── app/auth.helpers.server.ts
│   └── package.json      # Fragment
├── storage/              # R2 overlay
│   ├── package.json      # Fragment
│   └── wrangler.toml     # Fragment
├── email/                # Email overlay
│   ├── app/email/send.ts
│   ├── app/email/templates/welcome.tsx
│   ├── package.json      # Fragment
│   └── .dev.vars         # Fragment
├── ui/                   # UI + actions overlay
│   ├── app/components/Header.tsx
│   └── package.json      # Fragment
└── admin/                # Admin overlay
    ├── app/routes/admin.tsx
    ├── app/admin.server.ts
    └── package.json      # Fragment
```

### Template variables

Simple `{{placeholder}}` string replacement:
- `{{projectName}}` — project name

### Merger functions

Four files need merging across base + overlays:

1. **`mergePackageJson`** — combines `dependencies`, `devDependencies`, `scripts` from base + overlay fragments
2. **`mergeWranglerToml`** — appends `[[d1_databases]]`, `[[r2_buckets]]`, `[[kv_namespaces]]` sections from overlay fragments to base
3. **`mergeCfastServer`** — generated programmatically based on enabled features (plugin imports + `.use()` chain)
4. **`mergeViteConfig`** — generated programmatically based on enabled features (`optimizeDeps.include` entries)

## Scaffold Orchestration

1. Copy `templates/base/` → `targetDir/`
2. For each enabled feature, copy its overlay into `targetDir/` (new files only, no overwrites)
3. Run mergers on accumulated fragments → write merged `package.json`, `wrangler.toml`, `cfast.server.ts`, `vite.config.ts`
4. Run `{{placeholder}}` replacement on all copied files
5. Write final merged files to `targetDir/`

## Feature Dependency Graph

```
admin → db, ui, auth
ui → actions (implicit, always bundled)
auth → db
email → (standalone)
storage → (standalone)
db → (standalone)
```

Auto-resolved dependencies are communicated to the user:

```
✔ Selected: admin, email
  Added automatically: db, auth, ui (required by admin)
```

## Post-Scaffold Output

Print next steps tailored to selected features (no auto-install, no git init):

```
✔ Scaffolded my-app/

  Next steps:
    cd my-app
    pnpm install
    pnpm dev

  Database (D1 + Drizzle):
    pnpm db:generate
    pnpm db:migrate:local

  Deploy:
    pnpm deploy:staging
    pnpm deploy:production
```

## Source Structure

```
src/
├── index.ts          # Entry point: pipeline orchestration
├── args.ts           # CLI argument parsing (process.argv)
├── prompts.ts        # Interactive prompts (prompts library)
├── config.ts         # Config resolution, feature dep resolution
├── scaffold.ts       # Copy base, apply overlays, run mergers
├── merge/
│   ├── package-json.ts
│   ├── wrangler-toml.ts
│   ├── cfast-server.ts
│   └── vite-config.ts
└── utils.ts          # File copy, template replacement, print helpers
```

## Dependencies

- `prompts` — interactive CLI prompts
- `kolorist` — terminal colors (already in package.json)

No template engine needed.

## Decisions

- **File-based templates** over inline template strings — easier to maintain and review
- **Base + overlay** over single template with removal — modular, extensible
- **Simple string replacement** over template engines — overlays minimize within-file conditionals
- **Print instructions** over auto-install — no surprises
- **Built-in templates only** — no custom template support for now
- **Pipeline architecture** over plugin/hook system — right level of abstraction
