# create-cfast

**Scaffold a fully wired Cloudflare Workers + React Router project in one command.**

```bash
npm create cfast@latest my-app
```

No boilerplate. No copy-pasting API keys into the wrong file. No figuring out how to wire Drizzle to D1. The scaffolder asks you what you need, sets up every package, and gives you a running app with auth, permissions, and email working out of the box.

## What It Does

### Interactive Setup

```
$ npm create cfast@latest my-app

  Welcome to cfast!

  Project name: my-app

  Which packages do you need?
  [x] @cfast/auth       - Authentication (magic email + passkeys)
  [x] @cfast/permissions - Permission system
  [x] @cfast/db          - D1 database with Drizzle
  [x] @cfast/ui          - Auto-forms and permission-aware components
  [ ] @cfast/admin       - Admin panel
  [x] @cfast/email       - Email via Mailgun
  [x] @cfast/router      - Multi-action routes & pagination

  UI library:
  (*) MUI Joy UI
  ( ) Headless (bring your own)

  Let's set up your API keys.
  We'll configure these per environment (dev / staging / production).

  Mailgun API Key (dev): ****
  Mailgun domain (dev): sandbox1234.mailgun.org
  Mailgun API Key (production): **** (or press Enter to set later)
  Mailgun domain (production): mail.myapp.com

  Cloudflare Account ID: ****

  Creating project...
  Installing dependencies...
  Setting up wrangler.toml...
  Generating Drizzle schema...
  Creating example routes...

  Done! Next steps:
    cd my-app
    pnpm dev
```

### What You Get

```
my-app/
├── app/
│   ├── routes/
│   │   ├── _index.tsx              # Home page
│   │   ├── login.tsx               # Magic link + passkey login
│   │   └── dashboard.tsx           # Authenticated route example
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema with auth tables
│   │   └── migrations/             # D1 migrations
│   ├── auth.ts                     # @cfast/auth config
│   ├── permissions.ts              # @cfast/permissions definitions
│   └── emails/
│       ├── magic-link.tsx          # react-email template
│       └── welcome.tsx             # react-email template
├── wrangler.toml                   # Pre-configured with D1, KV bindings
├── .dev.vars                       # Local development secrets
├── .env.staging                    # Staging API keys
├── .env.production                 # Production API keys (empty, fill in later)
├── drizzle.config.ts               # Drizzle Kit config for D1
├── package.json
└── tsconfig.json
```

### Environment-Aware Secrets

The scaffolder creates separate secret files per environment and configures wrangler to use them:

- `.dev.vars` — Local development (Mailgun sandbox, etc.)
- `.env.staging` — Staging environment keys
- `.env.production` — Production keys (created empty with comments about what's needed)

All secret files are added to `.gitignore` automatically.

### Working Examples

The generated project includes working examples of:

- **Magic link authentication** — Send a magic link, verify it, create a session
- **Passkey registration and login** — Full WebAuthn flow
- **Permission-guarded routes** — Loader that requires authentication
- **Multi-action route** — Create and delete in the same page
- **Auto-generated form** — Form derived from the Drizzle schema
- **Email sending** — Welcome email sent after registration

### Post-Scaffold Commands

After scaffolding, you can:

```bash
pnpm dev                    # Start local development (wrangler + react-email preview)
pnpm db:generate            # Generate D1 migrations from schema changes
pnpm db:migrate:local       # Apply migrations to local D1
pnpm db:migrate:remote      # Apply migrations to remote D1
pnpm deploy:staging         # Deploy to staging
pnpm deploy:production      # Deploy to production
```
