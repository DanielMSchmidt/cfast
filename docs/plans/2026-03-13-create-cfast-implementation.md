# create-cfast Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI scaffolder that generates a fully wired Cloudflare Workers + React Router project using @cfast/* packages.

**Architecture:** Pipeline architecture (`parseArgs → promptForMissing → resolveConfig → scaffold → printNextSteps`). File-based templates with a base directory + per-feature overlay directories. Seven files are generated programmatically based on selected features: `package.json`, `wrangler.toml`, `env.ts`, `cfast.server.ts`, `vite.config.ts`, `root.tsx`, `routes.ts`. This runs on Node.js (not Workers) — Node.js APIs are fine in the scaffolder source code.

**Tech Stack:** TypeScript, tsup, Node.js `fs/path/url`, `prompts`, `kolorist`, vitest

---

### Task 1: Package Setup + Types

**Files:**
- Modify: `packages/create-cfast/package.json`
- Modify: `packages/create-cfast/tsconfig.json`
- Create: `packages/create-cfast/src/types.ts`
- Create: `packages/create-cfast/vitest.config.ts`

**Step 1: Update package.json**

Add `files`, `vitest`, `@types/node` devDep, and `test` script:

```json
{
  "name": "create-cfast",
  "version": "0.0.1",
  "description": "Scaffold a fully wired Cloudflare Workers + React Router project with cfast",
  "type": "module",
  "bin": {
    "create-cfast": "./dist/index.js"
  },
  "files": ["dist", "templates"],
  "scripts": {
    "build": "tsup src/index.ts --format esm",
    "dev": "tsup src/index.ts --format esm --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "dependencies": {
    "kolorist": "^1",
    "prompts": "^2"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/prompts": "^2",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^3"
  }
}
```

**Step 2: Update tsconfig.json**

The scaffolder runs on Node.js, not Workers. Update tsconfig to reflect this:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
  },
});
```

**Step 4: Create src/types.ts**

```typescript
export type Features = {
  auth: boolean;
  db: boolean;
  storage: boolean;
  email: boolean;
  ui: boolean;
  admin: boolean;
};

export type UiLibrary = "joy" | "headless";

export type Config = {
  projectName: string;
  targetDir: string;
  features: Features;
  uiLibrary: UiLibrary | null;
};

export type CliArgs = {
  projectName: string | undefined;
  auth: boolean;
  db: boolean;
  storage: boolean;
  email: boolean;
  ui: boolean;
  admin: boolean;
  all: boolean;
  help: boolean;
};

export const FEATURE_NAMES = ["auth", "db", "storage", "email", "ui", "admin"] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];
```

**Step 5: Run typecheck**

```bash
cd packages/create-cfast && pnpm typecheck
```

**Step 6: Commit**

```bash
git add packages/create-cfast/
git commit -m "feat(create-cfast): package setup and types"
```

---

### Task 2: Config Resolution (with tests)

**Files:**
- Create: `packages/create-cfast/src/config.ts`
- Create: `packages/create-cfast/src/__tests__/config.test.ts`

**Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { resolveFeatureDeps, resolveConfig } from "../config";

describe("resolveFeatureDeps", () => {
  it("returns features unchanged when no deps needed", () => {
    const features = { auth: false, db: true, storage: false, email: false, ui: false, admin: false };
    const result = resolveFeatureDeps(features);
    expect(result).toEqual(features);
  });

  it("auth implies db", () => {
    const features = { auth: true, db: false, storage: false, email: false, ui: false, admin: false };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
    expect(result.auth).toBe(true);
  });

  it("admin implies db, ui, auth", () => {
    const features = { auth: false, db: false, storage: false, email: false, ui: false, admin: true };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
    expect(result.ui).toBe(true);
    expect(result.auth).toBe(true);
    expect(result.admin).toBe(true);
  });

  it("admin transitively implies db via auth", () => {
    const features = { auth: false, db: false, storage: false, email: false, ui: false, admin: true };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
  });
});

describe("resolveConfig", () => {
  it("sets uiLibrary to null when ui not selected", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: false, db: false, storage: false, email: false, ui: false, admin: false },
      uiLibrary: null,
    });
    expect(config.uiLibrary).toBeNull();
  });

  it("defaults uiLibrary to joy when ui selected and no preference", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: false, db: false, storage: false, email: false, ui: true, admin: false },
      uiLibrary: null,
    });
    expect(config.uiLibrary).toBe("joy");
  });

  it("resolves feature deps", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: true, db: false, storage: false, email: false, ui: false, admin: false },
      uiLibrary: null,
    });
    expect(config.features.db).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/create-cfast && pnpm test
```
Expected: FAIL — module not found.

**Step 3: Implement config.ts**

```typescript
import type { Config, Features } from "./types";

export function resolveFeatureDeps(features: Features): Features {
  const resolved = { ...features };

  if (resolved.admin) {
    resolved.db = true;
    resolved.ui = true;
    resolved.auth = true;
  }

  if (resolved.auth) {
    resolved.db = true;
  }

  return resolved;
}

export function getAutoAddedFeatures(
  original: Features,
  resolved: Features,
): string[] {
  const added: string[] = [];
  for (const key of Object.keys(resolved) as (keyof Features)[]) {
    if (resolved[key] && !original[key]) {
      added.push(key);
    }
  }
  return added;
}

export function resolveConfig(raw: Config): Config {
  const features = resolveFeatureDeps(raw.features);
  const uiLibrary = features.ui ? (raw.uiLibrary ?? "joy") : null;
  return { ...raw, features, uiLibrary };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/create-cfast && pnpm test
```

**Step 5: Commit**

```bash
git add packages/create-cfast/src/config.ts packages/create-cfast/src/__tests__/config.test.ts
git commit -m "feat(create-cfast): config resolution with feature dependency graph"
```

---

### Task 3: CLI Argument Parsing (with tests)

**Files:**
- Create: `packages/create-cfast/src/args.ts`
- Create: `packages/create-cfast/src/__tests__/args.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { parseArgs } from "../args";

describe("parseArgs", () => {
  it("parses project name from positional arg", () => {
    const result = parseArgs(["my-app"]);
    expect(result.projectName).toBe("my-app");
  });

  it("returns undefined projectName when not provided", () => {
    const result = parseArgs([]);
    expect(result.projectName).toBeUndefined();
  });

  it("parses boolean feature flags", () => {
    const result = parseArgs(["my-app", "--auth", "--db"]);
    expect(result.auth).toBe(true);
    expect(result.db).toBe(true);
    expect(result.storage).toBe(false);
  });

  it("parses --all flag", () => {
    const result = parseArgs(["--all"]);
    expect(result.all).toBe(true);
  });

  it("parses --help flag", () => {
    const result = parseArgs(["--help"]);
    expect(result.help).toBe(true);
  });

  it("ignores unknown flags", () => {
    const result = parseArgs(["my-app", "--unknown"]);
    expect(result.projectName).toBe("my-app");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/create-cfast && pnpm test
```

**Step 3: Implement args.ts**

```typescript
import type { CliArgs } from "./types";

const BOOLEAN_FLAGS = ["auth", "db", "storage", "email", "ui", "admin", "all", "help"] as const;

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    projectName: undefined,
    auth: false,
    db: false,
    storage: false,
    email: false,
    ui: false,
    admin: false,
    all: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const flag = arg.slice(2) as (typeof BOOLEAN_FLAGS)[number];
      if (BOOLEAN_FLAGS.includes(flag)) {
        args[flag] = true;
      }
    } else if (!args.projectName) {
      args.projectName = arg;
    }
  }

  return args;
}

export function printHelp(): void {
  console.log(`
  Usage: create-cfast [project-name] [options]

  Options:
    --auth       Include @cfast/auth (magic email + passkeys)
    --db         Include @cfast/db (D1 + Drizzle ORM)
    --storage    Include @cfast/storage (R2 file uploads)
    --email      Include @cfast/email (email sending)
    --ui         Include @cfast/ui (components + actions)
    --admin      Include @cfast/admin (admin panel)
    --all        Include all packages
    --help       Show this help message
  `);
}
```

**Step 4: Run tests**

```bash
cd packages/create-cfast && pnpm test
```

**Step 5: Commit**

```bash
git add packages/create-cfast/src/args.ts packages/create-cfast/src/__tests__/args.test.ts
git commit -m "feat(create-cfast): CLI argument parsing"
```

---

### Task 4: Interactive Prompts

**Files:**
- Create: `packages/create-cfast/src/prompts.ts`

**Step 1: Implement prompts.ts**

```typescript
import prompts from "prompts";
import { green } from "kolorist";
import type { CliArgs, Config, FeatureName, UiLibrary } from "./types";
import { FEATURE_NAMES } from "./types";
import { resolveConfig, resolveFeatureDeps, getAutoAddedFeatures } from "./config";

const FEATURE_LABELS: Record<FeatureName, string> = {
  auth: "@cfast/auth — Authentication (magic email + passkeys)",
  db: "@cfast/db — D1 database with Drizzle ORM",
  storage: "@cfast/storage — R2 file uploads",
  email: "@cfast/email — Email via Mailgun",
  ui: "@cfast/ui — Permission-aware components + actions",
  admin: "@cfast/admin — Admin panel",
};

export async function promptForConfig(args: CliArgs): Promise<Config | null> {
  // Project name
  let projectName = args.projectName;
  if (!projectName) {
    const result = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-cfast-app",
    });
    if (!result.projectName) return null;
    projectName = result.projectName as string;
  }

  // Features
  const hasAnyFeatureFlag = FEATURE_NAMES.some((f) => args[f]) || args.all;
  let selectedFeatures: FeatureName[];

  if (args.all) {
    selectedFeatures = [...FEATURE_NAMES];
  } else if (hasAnyFeatureFlag) {
    selectedFeatures = FEATURE_NAMES.filter((f) => args[f]);
  } else {
    const result = await prompts({
      type: "multiselect",
      name: "features",
      message: "Which packages do you need?",
      choices: FEATURE_NAMES.map((name) => ({
        title: FEATURE_LABELS[name],
        value: name,
      })),
    });
    if (!result.features) return null;
    selectedFeatures = result.features as FeatureName[];
  }

  const features = {
    auth: selectedFeatures.includes("auth"),
    db: selectedFeatures.includes("db"),
    storage: selectedFeatures.includes("storage"),
    email: selectedFeatures.includes("email"),
    ui: selectedFeatures.includes("ui"),
    admin: selectedFeatures.includes("admin"),
  };

  // Show auto-resolved deps
  const resolved = resolveFeatureDeps(features);
  const autoAdded = getAutoAddedFeatures(features, resolved);
  if (autoAdded.length > 0) {
    console.log(green(`  Added automatically: ${autoAdded.join(", ")}`));
  }

  // UI library
  let uiLibrary: UiLibrary | null = null;
  if (resolved.ui) {
    const result = await prompts({
      type: "select",
      name: "uiLibrary",
      message: "UI library:",
      choices: [
        { title: "MUI Joy UI", value: "joy" },
        { title: "Headless (bring your own)", value: "headless" },
      ],
    });
    if (result.uiLibrary === undefined) return null;
    uiLibrary = result.uiLibrary as UiLibrary;
  }

  const targetDir = projectName;

  return resolveConfig({
    projectName,
    targetDir,
    features: resolved,
    uiLibrary,
  });
}
```

**Step 2: Run typecheck**

```bash
cd packages/create-cfast && pnpm typecheck
```

**Step 3: Commit**

```bash
git add packages/create-cfast/src/prompts.ts
git commit -m "feat(create-cfast): interactive prompts"
```

---

### Task 5: File Utilities

**Files:**
- Create: `packages/create-cfast/src/utils.ts`

**Step 1: Implement utils.ts**

```typescript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTemplatesDir(): string {
  // In dist/index.js, templates is at ../templates
  return path.resolve(__dirname, "..", "templates");
}

export function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Skip package.json and wrangler.toml fragments — handled by mergers
      if (entry.name === "package.json" || entry.name === "wrangler.toml") {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function replaceInDir(dir: string, replacements: Record<string, string>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath, replacements);
    } else {
      replaceInFile(fullPath, replacements);
    }
  }
}

function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  // Skip binary files
  const ext = path.extname(filePath);
  const textExts = [".ts", ".tsx", ".js", ".json", ".toml", ".md", ".html", ".css", ".gitignore", ""];
  if (!textExts.includes(ext) && !filePath.endsWith(".gitignore")) return;

  let content = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  fs.writeFileSync(filePath, content);
}

export function readJsonFragment(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
}

export function readTextFragment(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
```

**Step 2: Run typecheck**

```bash
cd packages/create-cfast && pnpm typecheck
```

**Step 3: Commit**

```bash
git add packages/create-cfast/src/utils.ts
git commit -m "feat(create-cfast): file utilities"
```

---

### Task 6: Base Template

**Files:** Create all files under `packages/create-cfast/templates/base/`

**Step 1: Create base template files**

Create `templates/base/app/routes/_index.tsx`:
```tsx
export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Welcome to {{projectName}}</h1>
      <p>Get started by editing <code>app/routes/_index.tsx</code></p>
    </div>
  );
}
```

Create `templates/base/app/permissions.ts`:
```typescript
import { definePermissions } from "@cfast/permissions";

export type UserRole = "admin" | "member";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
};

const appRoles = ["member", "admin"] as const;

export const permissions = definePermissions<AuthUser>()({
  roles: appRoles,
  hierarchy: {
    admin: ["member"],
  },
  grants: (grant) => ({
    member: [],
    admin: [grant("manage", "all")],
  }),
});
```

Create `templates/base/app/entry.server.tsx`:
```tsx
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

Create `templates/base/workers/app.ts`:
```typescript
import { createRequestHandler } from "react-router";
import { app } from "../app/cfast.server";
import { env } from "../app/env";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

type Env = ReturnType<typeof env.get>;

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, rawEnv: Record<string, unknown>, ctx: ExecutionContext) {
    app.init(rawEnv);
    env.init(rawEnv);
    return requestHandler(request, {
      cloudflare: { env: env.get(), ctx },
    });
  },
};
```

Create `templates/base/react-router.config.ts`:
```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
```

Create `templates/base/tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.cloudflare.json" }
  ],
  "compilerOptions": {
    "checkJs": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  }
}
```

Create `templates/base/tsconfig.cloudflare.json`:
```json
{
  "extends": "./tsconfig.json",
  "include": [
    ".react-router/types/**/*",
    "app/**/*",
    "app/**/.server/**/*",
    "app/**/.client/**/*",
    "workers/**/*",
    "worker-configuration.d.ts"
  ],
  "compilerOptions": {
    "composite": true,
    "strict": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["vite/client"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "rootDirs": [".", "./.react-router/types"],
    "paths": { "~/*": ["./app/*"] },
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

Create `templates/base/tsconfig.node.json`:
```json
{
  "extends": "./tsconfig.json",
  "include": ["vite.config.ts"],
  "compilerOptions": {
    "composite": true,
    "strict": true,
    "types": ["node"],
    "lib": ["ES2022", "DOM"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

Create `templates/base/_gitignore` (renamed to .gitignore during copy):
```
.DS_Store
.env
/node_modules/
*.tsbuildinfo

# React Router
/.react-router/
/build/

# Cloudflare
.mf
.wrangler
.dev.vars*
worker-configuration.d.ts
```

> **Note:** Name the file `_gitignore` in the template to prevent npm from stripping it during publish. The scaffold function renames it to `.gitignore` when copying.

Create `templates/base/package.json` (base fragment):
```json
{
  "name": "{{projectName}}",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "preview": "pnpm run build && vite preview",
    "typecheck": "react-router typegen && tsc -b",
    "deploy:staging": "pnpm run build && wrangler deploy --env staging",
    "deploy:production": "pnpm run build && wrangler deploy --env production"
  },
  "dependencies": {
    "@cfast/core": "^0.1.0",
    "@cfast/env": "^0.1.0",
    "@cfast/permissions": "^0.1.0",
    "isbot": "^5.1.31",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.1"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "^1.27.0",
    "@cloudflare/workers-types": "^4.20260310.1",
    "@react-router/dev": "^7.13.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "typescript": "^5.9.2",
    "vite": "^8.0.0",
    "wrangler": "^4.72.0"
  }
}
```

**Step 2: Update copyDir in utils.ts to rename `_gitignore` → `.gitignore`**

In `src/utils.ts`, update the file copy logic to handle dotfile renaming:

```typescript
// In the copyDir function, after determining destPath:
const destName = entry.name === "_gitignore" ? ".gitignore" : entry.name;
const destPath = path.join(dest, destName);
```

**Step 3: Commit**

```bash
git add packages/create-cfast/templates/base/ packages/create-cfast/src/utils.ts
git commit -m "feat(create-cfast): base template"
```

---

### Task 7: DB + Auth Overlay Templates

**Files:** Create files under `packages/create-cfast/templates/db/` and `templates/auth/`

**Step 1: Create DB overlay**

Create `templates/db/app/db/schema.ts`:
```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

Create `templates/db/app/db/client.ts`:
```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
```

Create `templates/db/drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

Create `templates/db/package.json` (fragment):
```json
{
  "dependencies": {
    "@cfast/db": "^0.1.0",
    "drizzle-orm": "^0.45.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.9"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote"
  }
}
```

**Step 2: Create Auth overlay**

Create `templates/auth/app/db/schema.ts` (overwrites db overlay's schema when auth is selected):
```typescript
import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Auth tables (required by Better Auth + @cfast/auth)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const passkeys = sqliteTable("passkeys", {
  id: text("id").primaryKey(),
  name: text("name"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: integer("backed_up", { mode: "boolean" }).default(false),
  transports: text("transports"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  grantedBy: text("granted_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// App tables — add your own here
export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  authorId: text("author_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  roles: many(roles),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  author: one(users, { fields: [items.authorId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ one }) => ({
  user: one(users, { fields: [roles.userId], references: [users.id] }),
}));
```

Create `templates/auth/app/routes/login.tsx`:
```tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { LoginPage } from "@cfast/auth/client";
import { joyLoginComponents } from "@cfast/ui/joy";
import { getUser } from "~/auth.helpers.server";
import { authClient } from "~/auth.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return {};
}

export default function Login() {
  useLoaderData<typeof loader>();

  return (
    <LoginPage
      authClient={authClient}
      components={joyLoginComponents}
      title="Sign In"
      subtitle="Sign in to {{projectName}}"
    />
  );
}
```

Create `templates/auth/app/routes/auth.$.tsx`:
```typescript
import { createAuthRouteHandlers } from "@cfast/auth";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

const { loader, action } = createAuthRouteHandlers(() => {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
});

export { loader, action };
```

Create `templates/auth/app/auth.setup.server.ts`:
```typescript
import { createAuth } from "@cfast/auth";
import * as schema from "./db/schema";
import { permissions } from "./permissions";
import { env } from "./env";

export const initAuth = createAuth({
  permissions,
  schema,
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      // TODO: integrate with @cfast/email when email feature is enabled
      console.log(`Magic link for ${email}: ${url}`);
    },
  },
  session: { expiresIn: "30d" },
  defaultRoles: ["member"],
});
```

Create `templates/auth/app/auth.client.ts`:
```typescript
import { createAuthClient, magicLinkClient } from "@cfast/auth/client";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
});
```

Create `templates/auth/app/auth.helpers.server.ts`:
```typescript
import { initAuth } from "./auth.setup.server";
import { env } from "./env";
import type { Grant } from "@cfast/permissions";
import type { AuthUser } from "./permissions";

export type AuthContext = { user: AuthUser | null; grants: Grant[] };
export type AuthenticatedContext = { user: AuthUser; grants: Grant[] };

function getAuth() {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const ctx = await getAuth().createContext(request);
  return ctx as AuthContext;
}

export async function requireAuthContext(request: Request): Promise<AuthenticatedContext> {
  const ctx = await getAuth().requireUser(request);
  return ctx as AuthenticatedContext;
}

export async function getUser(request: Request): Promise<AuthUser | null> {
  const ctx = await getAuthContext(request);
  return ctx.user;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const ctx = await requireAuthContext(request);
  return ctx.user;
}
```

Create `templates/auth/package.json` (fragment):
```json
{
  "dependencies": {
    "@cfast/auth": "^0.1.0",
    "@better-auth/drizzle-adapter": "^1.5.3",
    "@better-auth/passkey": "^1.5.3",
    "better-auth": "^1.2.0"
  }
}
```

**Step 3: Commit**

```bash
git add packages/create-cfast/templates/db/ packages/create-cfast/templates/auth/
git commit -m "feat(create-cfast): db and auth overlay templates"
```

---

### Task 8: Storage, Email, UI, Admin Overlay Templates

**Files:** Create overlay directories under `packages/create-cfast/templates/`

**Step 1: Create Storage overlay**

Create `templates/storage/package.json`:
```json
{
  "dependencies": {
    "@cfast/storage": "^0.1.0"
  }
}
```

**Step 2: Create Email overlay**

Create `templates/email/app/email.server.ts`:
```typescript
import { createEmailClient } from "@cfast/email";
import { mailgun } from "@cfast/email/mailgun";
import { console as consoleProvider } from "@cfast/email/console";
import type { EmailProvider } from "@cfast/email";
import { env } from "~/env";

let cachedProvider: EmailProvider | null = null;
function getProvider(): EmailProvider {
  if (!cachedProvider) {
    const e = env.get();
    if (e.MAILGUN_API_KEY === "test-key") {
      cachedProvider = consoleProvider();
    } else {
      cachedProvider = mailgun(() => ({
        apiKey: env.get().MAILGUN_API_KEY,
        domain: env.get().MAILGUN_DOMAIN,
      }));
    }
  }
  return cachedProvider;
}

const lazyProvider: EmailProvider = {
  name: "lazy",
  send(message) {
    return getProvider().send(message);
  },
};

export const email = createEmailClient({
  provider: lazyProvider,
  from: () => `{{projectName}} <noreply@${env.get().MAILGUN_DOMAIN}>`,
});
```

Create `templates/email/app/email/templates/welcome.tsx`:
```tsx
interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <html>
      <head />
      <body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h1>Welcome to {{projectName}}!</h1>
          <p>Hi {name}, your account has been created successfully.</p>
          <hr />
          <p style={{ color: "#666", fontSize: "12px" }}>{{projectName}}</p>
        </div>
      </body>
    </html>
  );
}
```

Create `templates/email/app/email/send.ts`:
```typescript
import { email } from "~/email.server";
import { WelcomeEmail } from "./templates/welcome";

export async function sendWelcomeEmail(emailAddress: string, name: string) {
  await email.send({
    to: emailAddress,
    subject: "Welcome to {{projectName}}!",
    react: WelcomeEmail({ name }),
  });
}
```

Create `templates/email/package.json`:
```json
{
  "dependencies": {
    "@cfast/email": "^0.1.0",
    "@react-email/components": "^1.0.0"
  }
}
```

**Step 3: Create UI overlay**

Create `templates/ui/app/components/Header.tsx`:
```tsx
import { Link } from "react-router";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";

type HeaderProps = {
  user?: { name: string } | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <Container sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography level="h4" component={Link} to="/" sx={{ textDecoration: "none" }}>
          {{projectName}}
        </Typography>
        <Stack direction="row" spacing={1}>
          {user ? (
            <Typography level="body-sm">{user.name}</Typography>
          ) : (
            <Button component={Link} to="/login" size="sm">
              Sign In
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
```

Create `templates/ui/app/actions.server.ts`:
```typescript
import { createActions } from "@cfast/actions";
import { app } from "~/cfast.server";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const ctx = await app.context(request);
    if (!ctx.auth.user) {
      throw new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    return { db: ctx.db.client, user: ctx.auth.user, grants: ctx.auth.grants };
  },
});
```

Create `templates/ui/package.json`:
```json
{
  "dependencies": {
    "@cfast/actions": "^0.1.0",
    "@cfast/ui": "^0.1.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/joy": "^5.0.0-beta.51",
    "@mui/material": "^6.4.0"
  }
}
```

**Step 4: Create Admin overlay**

Create `templates/admin/app/routes/admin.tsx`:
```tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { AdminPanel } from "@cfast/admin/client";
import { joyAdminComponents } from "@cfast/ui/joy";
import { adminLoader, adminAction } from "~/admin.server";

export async function loader(args: LoaderFunctionArgs) {
  return adminLoader(args.request);
}

export async function action(args: ActionFunctionArgs) {
  return adminAction(args.request);
}

export default function Admin() {
  const data = useLoaderData<typeof loader>();
  return <AdminPanel data={data} components={joyAdminComponents} />;
}
```

Create `templates/admin/app/admin.server.ts`:
```typescript
import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
import type { AdminAuthConfig, AdminUser } from "@cfast/admin";
import { createDb } from "@cfast/db";
import type { DbConfig } from "@cfast/db";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import * as schema from "~/db/schema";

const auth: AdminAuthConfig = {
  async requireUser(request: Request) {
    const ctx = await requireAuthContext(request);
    const user: AdminUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: null,
      roles: ctx.user.roles,
    };
    return { user, grants: ctx.grants };
  },

  hasRole(user: AdminUser, role: string) {
    return hasRole(
      user as Parameters<typeof hasRole>[0],
      role as Parameters<typeof hasRole>[1],
    );
  },

  async getRoles(userId: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    return authInstance.getRoles(userId);
  },

  async setRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRole(userId, role);
  },

  async removeRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.removeRole(userId, role);
  },

  async setRoles(userId: string, roles: string[]) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRoles(userId, roles);
  },
};

function createDbForAdmin(grants: unknown[], user: { id: string } | null) {
  const e = env.get();
  return createDb({
    d1: e.DB,
    schema: schema as unknown as DbConfig["schema"],
    grants: grants as Parameters<typeof createDb>[0]["grants"],
    user,
    cache: false,
  });
}

const adminConfig = {
  db: createDbForAdmin,
  auth,
  schema: {
    items: schema.items,
  },
  users: {
    assignableRoles: ["admin", "member"],
  },
  dashboard: {
    widgets: [
      { type: "count" as const, table: "items", label: "Total Items" },
      { type: "recent" as const, table: "items", label: "Recent Items", limit: 5 },
    ],
  },
  requiredRole: "admin",
};

const tableMetas = introspectSchema(adminConfig.schema);

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
```

Create `templates/admin/package.json`:
```json
{
  "dependencies": {
    "@cfast/admin": "^0.1.0",
    "nanoid": "^5.1.0"
  }
}
```

**Step 5: Commit**

```bash
git add packages/create-cfast/templates/storage/ packages/create-cfast/templates/email/ packages/create-cfast/templates/ui/ packages/create-cfast/templates/admin/
git commit -m "feat(create-cfast): storage, email, ui, admin overlay templates"
```

---

### Task 9: Package.json Merger + Wrangler.toml Generator (with tests)

**Files:**
- Create: `packages/create-cfast/src/generators/package-json.ts`
- Create: `packages/create-cfast/src/generators/wrangler-toml.ts`
- Create: `packages/create-cfast/src/__tests__/generators.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { mergePackageJsons } from "../generators/package-json";
import { generateWranglerToml } from "../generators/wrangler-toml";
import type { Config } from "../types";

describe("mergePackageJsons", () => {
  it("merges dependencies from multiple fragments", () => {
    const base = {
      name: "test",
      dependencies: { react: "^19.0.0" },
      devDependencies: { typescript: "^5.0.0" },
      scripts: { dev: "vite" },
    };
    const fragments = [
      { dependencies: { "drizzle-orm": "^0.45.0" }, scripts: { "db:generate": "drizzle-kit generate" } },
      { dependencies: { "better-auth": "^1.2.0" } },
    ];

    const result = mergePackageJsons(base, fragments);
    expect(result.dependencies.react).toBe("^19.0.0");
    expect(result.dependencies["drizzle-orm"]).toBe("^0.45.0");
    expect(result.dependencies["better-auth"]).toBe("^1.2.0");
    expect(result.scripts["db:generate"]).toBe("drizzle-kit generate");
    expect(result.scripts.dev).toBe("vite");
  });

  it("produces valid JSON string", () => {
    const base = { name: "test", dependencies: {} };
    const result = mergePackageJsons(base, []);
    expect(() => JSON.parse(JSON.stringify(result))).not.toThrow();
  });
});

const baseConfig: Config = {
  projectName: "test-app",
  targetDir: "/tmp/test-app",
  features: { auth: false, db: false, storage: false, email: false, ui: false, admin: false },
  uiLibrary: null,
};

describe("generateWranglerToml", () => {
  it("generates minimal config without features", () => {
    const result = generateWranglerToml(baseConfig);
    expect(result).toContain('name = "test-app"');
    expect(result).not.toContain("[[d1_databases]]");
    expect(result).not.toContain("[[r2_buckets]]");
  });

  it("adds D1 binding when db is enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, db: true } };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[d1_databases]]");
    expect(result).toContain('binding = "DB"');
  });

  it("adds R2 binding when storage is enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, storage: true } };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[r2_buckets]]");
    expect(result).toContain('binding = "UPLOADS"');
  });

  it("adds KV binding when auth is enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, auth: true, db: true } };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[kv_namespaces]]");
    expect(result).toContain('binding = "CACHE"');
  });

  it("adds MAILGUN vars when email is enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, email: true } };
    const result = generateWranglerToml(config);
    expect(result).toContain("MAILGUN_DOMAIN");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/create-cfast && pnpm test
```

**Step 3: Implement package-json.ts**

```typescript
type PkgFragment = {
  name?: string;
  private?: boolean;
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export function mergePackageJsons(
  base: PkgFragment,
  fragments: PkgFragment[],
): PkgFragment {
  const merged: PkgFragment = {
    name: base.name,
    private: base.private,
    type: base.type,
    scripts: { ...base.scripts },
    dependencies: { ...base.dependencies },
    devDependencies: { ...base.devDependencies },
  };

  for (const fragment of fragments) {
    if (fragment.dependencies) {
      merged.dependencies = { ...merged.dependencies, ...fragment.dependencies };
    }
    if (fragment.devDependencies) {
      merged.devDependencies = { ...merged.devDependencies, ...fragment.devDependencies };
    }
    if (fragment.scripts) {
      merged.scripts = { ...merged.scripts, ...fragment.scripts };
    }
  }

  // Sort dependencies alphabetically
  if (merged.dependencies) {
    merged.dependencies = sortKeys(merged.dependencies);
  }
  if (merged.devDependencies) {
    merged.devDependencies = sortKeys(merged.devDependencies);
  }

  return merged;
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

export function stringifyPackageJson(pkg: PkgFragment): string {
  return JSON.stringify(pkg, null, 2) + "\n";
}
```

**Step 4: Implement wrangler-toml.ts**

```typescript
import type { Config } from "../types";

export function generateWranglerToml(config: Config): string {
  const lines: string[] = [];

  lines.push(`name = "${config.projectName}"`);
  lines.push(`compatibility_date = "2025-12-01"`);
  lines.push(`compatibility_flags = ["nodejs_compat"]`);
  lines.push(`main = "./workers/app.ts"`);

  // [vars]
  const vars: [string, string][] = [
    ["APP_URL", "http://localhost:5173"],
  ];
  if (config.features.email) {
    vars.push(["MAILGUN_DOMAIN", "sandbox.mailgun.org"]);
  }
  lines.push("");
  lines.push("[vars]");
  for (const [key, value] of vars) {
    lines.push(`${key} = "${value}"`);
  }

  // [[d1_databases]]
  if (config.features.db) {
    lines.push("");
    lines.push("[[d1_databases]]");
    lines.push(`binding = "DB"`);
    lines.push(`database_name = "${config.projectName}"`);
    lines.push(`database_id = "local"`);
    lines.push(`migrations_dir = "drizzle"`);
  }

  // [[r2_buckets]]
  if (config.features.storage) {
    lines.push("");
    lines.push("[[r2_buckets]]");
    lines.push(`binding = "UPLOADS"`);
    lines.push(`bucket_name = "${config.projectName}-uploads"`);
  }

  // [[kv_namespaces]]
  if (config.features.auth) {
    lines.push("");
    lines.push("[[kv_namespaces]]");
    lines.push(`binding = "CACHE"`);
    lines.push(`id = "local"`);
  }

  lines.push("");
  return lines.join("\n");
}
```

**Step 5: Run tests**

```bash
cd packages/create-cfast && pnpm test
```

**Step 6: Commit**

```bash
git add packages/create-cfast/src/generators/ packages/create-cfast/src/__tests__/generators.test.ts
git commit -m "feat(create-cfast): package.json merger and wrangler.toml generator"
```

---

### Task 10: Code Generators — env, cfast-server, vite-config, root, routes (with tests)

**Files:**
- Create: `packages/create-cfast/src/generators/env.ts`
- Create: `packages/create-cfast/src/generators/cfast-server.ts`
- Create: `packages/create-cfast/src/generators/vite-config.ts`
- Create: `packages/create-cfast/src/generators/root-tsx.ts`
- Create: `packages/create-cfast/src/generators/routes-ts.ts`
- Create: `packages/create-cfast/src/generators/dev-vars.ts`
- Create: `packages/create-cfast/src/generators/index.ts`
- Modify: `packages/create-cfast/src/__tests__/generators.test.ts`

**Step 1: Add tests for generators**

Append to `src/__tests__/generators.test.ts`:

```typescript
import { generateEnv } from "../generators/env";
import { generateCfastServer } from "../generators/cfast-server";
import { generateViteConfig } from "../generators/vite-config";
import { generateRootTsx } from "../generators/root-tsx";
import { generateRoutesTs } from "../generators/routes-ts";

describe("generateEnv", () => {
  it("always includes APP_URL", () => {
    const result = generateEnv(baseConfig);
    expect(result).toContain("APP_URL");
  });

  it("adds DB binding when db enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, db: true } };
    const result = generateEnv(config);
    expect(result).toContain("DB");
    expect(result).toContain('"d1"');
  });

  it("adds MAILGUN when email enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, email: true } };
    const result = generateEnv(config);
    expect(result).toContain("MAILGUN_API_KEY");
    expect(result).toContain("MAILGUN_DOMAIN");
  });
});

describe("generateCfastServer", () => {
  it("always imports createApp", () => {
    const result = generateCfastServer(baseConfig);
    expect(result).toContain("createApp");
  });

  it("adds auth plugin when auth enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, auth: true, db: true } };
    const result = generateCfastServer(config);
    expect(result).toContain("authPlugin");
    expect(result).toContain("initAuth");
  });

  it("adds db plugin when db enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, db: true } };
    const result = generateCfastServer(config);
    expect(result).toContain("dbPlugin");
    expect(result).toContain("createDb");
  });
});

describe("generateViteConfig", () => {
  it("always includes cloudflare and reactRouter plugins", () => {
    const result = generateViteConfig(baseConfig);
    expect(result).toContain("cloudflare");
    expect(result).toContain("reactRouter");
  });

  it("adds optimizeDeps when ui enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, ui: true }, uiLibrary: "joy" as const };
    const result = generateViteConfig(config);
    expect(result).toContain("optimizeDeps");
    expect(result).toContain("@cfast/ui/joy");
  });
});

describe("generateRootTsx", () => {
  it("generates plain root without ui", () => {
    const result = generateRootTsx(baseConfig);
    expect(result).not.toContain("CssVarsProvider");
    expect(result).toContain("Outlet");
  });

  it("adds Joy UI providers when ui=joy", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, ui: true }, uiLibrary: "joy" as const };
    const result = generateRootTsx(config);
    expect(result).toContain("CssVarsProvider");
    expect(result).toContain("CssBaseline");
  });

  it("adds AuthClientProvider when auth enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, auth: true, db: true } };
    const result = generateRootTsx(config);
    expect(result).toContain("AuthClientProvider");
  });
});

describe("generateRoutesTs", () => {
  it("always includes index route", () => {
    const result = generateRoutesTs(baseConfig);
    expect(result).toContain("index(");
  });

  it("adds auth routes when auth enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, auth: true, db: true } };
    const result = generateRoutesTs(config);
    expect(result).toContain("login");
    expect(result).toContain("api/auth/*");
  });

  it("adds admin route when admin enabled", () => {
    const config = { ...baseConfig, features: { ...baseConfig.features, admin: true, db: true, auth: true, ui: true } };
    const result = generateRoutesTs(config);
    expect(result).toContain("admin");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/create-cfast && pnpm test
```

**Step 3: Implement generators**

Create `src/generators/env.ts`:
```typescript
import type { Config } from "../types";

export function generateEnv(config: Config): string {
  const bindings: string[] = [];
  bindings.push(`  APP_URL: { type: "var" as const, default: "http://localhost:5173" },`);

  if (config.features.db) {
    bindings.push(`  DB: { type: "d1" as const },`);
  }
  if (config.features.storage) {
    bindings.push(`  UPLOADS: { type: "r2" as const },`);
  }
  if (config.features.auth) {
    bindings.push(`  CACHE: { type: "kv" as const },`);
  }
  if (config.features.email) {
    bindings.push(`  MAILGUN_API_KEY: { type: "secret" as const },`);
    bindings.push(`  MAILGUN_DOMAIN: { type: "var" as const },`);
  }

  return `import { defineEnv } from "@cfast/env";

export const envSchema = {
${bindings.join("\n")}
};

export const env = defineEnv(envSchema);

export type Env = ReturnType<typeof env.get>;
`;
}
```

Create `src/generators/cfast-server.ts`:
```typescript
import type { Config } from "../types";

export function generateCfastServer(config: Config): string {
  const imports: string[] = [
    `import { createApp } from "@cfast/core";`,
    `import { envSchema } from "./env";`,
    `import { permissions } from "./permissions";`,
  ];

  const pluginDefs: string[] = [];
  const useChain: string[] = [];

  if (config.features.auth) {
    imports.push(`import { definePlugin } from "@cfast/core";`);
    imports.push(`import { initAuth } from "./auth.setup.server";`);
    imports.push(`import type { AuthUser } from "./permissions";`);
    imports.push(`import type { Grant } from "@cfast/permissions";`);

    pluginDefs.push(`
const authPlugin = definePlugin({
  name: "auth",
  async setup(ctx) {
    const auth = initAuth({
      d1: ctx.env.DB as D1Database,
      appUrl: ctx.env.APP_URL as string,
    });
    const authCtx = await auth.createContext(ctx.request);
    return {
      user: authCtx.user as AuthUser | null,
      grants: authCtx.grants as Grant[],
      instance: auth,
    };
  },
});`);
    useChain.push("authPlugin");
  }

  if (config.features.db) {
    imports.push(`import { createDb } from "@cfast/db";`);
    imports.push(`import * as schema from "./db/schema";`);

    if (config.features.auth) {
      pluginDefs.push(`
type AuthProvides = { auth: { user: AuthUser | null; grants: Grant[] } };
const dbPlugin = definePlugin<AuthProvides>()({
  name: "db",
  setup(ctx) {
    const client = createDb({
      d1: ctx.env.DB as D1Database,
      schema: schema as unknown as Record<string, unknown>,
      grants: ctx.auth.grants,
      user: ctx.auth.user ? { id: ctx.auth.user.id } : null,
      cache: false,
    });
    return { client };
  },
});`);
    } else {
      pluginDefs.push(`
const dbPlugin = definePlugin({
  name: "db",
  setup(ctx) {
    const client = createDb({
      d1: ctx.env.DB as D1Database,
      schema: schema as unknown as Record<string, unknown>,
      grants: [],
      user: null,
      cache: false,
    });
    return { client };
  },
});`);
    }
    useChain.push("dbPlugin");
  }

  const appLine = useChain.length > 0
    ? `export const app = createApp({ env: envSchema, permissions })\n${useChain.map((p) => `  .use(${p})`).join("\n")};`
    : `export const app = createApp({ env: envSchema, permissions });`;

  return `${imports.join("\n")}
${pluginDefs.join("\n")}

${appLine}
`;
}
```

Create `src/generators/vite-config.ts`:
```typescript
import type { Config } from "../types";

export function generateViteConfig(config: Config): string {
  const optimizeDeps: string[] = [];
  if (config.features.ui && config.uiLibrary === "joy") {
    optimizeDeps.push(`"@cfast/ui/joy"`);
  }
  if (config.features.ui) {
    optimizeDeps.push(`"@cfast/actions/client"`);
  }
  if (config.features.auth) {
    optimizeDeps.push(`"@cfast/auth/client"`);
  }

  const optimizeDepsBlock = optimizeDeps.length > 0
    ? `
  optimizeDeps: {
    include: [
      ${optimizeDeps.join(",\n      ")},
    ],
  },`
    : "";

  return `import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },${optimizeDepsBlock}
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
});
`;
}
```

Create `src/generators/root-tsx.ts`:
```typescript
import type { Config } from "../types";

export function generateRootTsx(config: Config): string {
  const imports: string[] = [
    `import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";`,
  ];

  const layoutWrappers: { open: string; close: string }[] = [];
  const appWrappers: { open: string; close: string }[] = [];

  if (config.features.ui && config.uiLibrary === "joy") {
    imports.push(`import { CssVarsProvider } from "@mui/joy/styles";`);
    imports.push(`import CssBaseline from "@mui/joy/CssBaseline";`);
    imports.push(`import Typography from "@mui/joy/Typography";`);
    imports.push(`import Container from "@mui/joy/Container";`);
    imports.push(`import { createUIPlugin, UIPluginProvider, ConfirmProvider } from "@cfast/ui";`);
    imports.push(`import { ConfirmDialog } from "@cfast/ui/joy";`);

    layoutWrappers.push(
      { open: `<CssVarsProvider>`, close: `</CssVarsProvider>` },
      { open: `<CssBaseline />`, close: `` },
      { open: `<UIPluginProvider plugin={plugin}>`, close: `</UIPluginProvider>` },
      { open: `<ConfirmProvider>`, close: `</ConfirmProvider>` },
    );
  }

  if (config.features.auth) {
    imports.push(`import { AuthClientProvider } from "@cfast/auth/client";`);
    imports.push(`import { authClient } from "~/auth.client";`);
    appWrappers.push({
      open: `<AuthClientProvider authClient={authClient}>`,
      close: `</AuthClientProvider>`,
    });
  }

  const pluginLine = config.features.ui && config.uiLibrary === "joy"
    ? `\nconst plugin = createUIPlugin({\n  components: { confirmDialog: ConfirmDialog },\n});\n`
    : "";

  // Build the Layout children wrapping
  let layoutChildren = `{children}`;
  for (const w of [...layoutWrappers].reverse()) {
    if (w.close) {
      layoutChildren = `${w.open}\n            ${layoutChildren}\n          ${w.close}`;
    } else {
      // Self-closing like CssBaseline
      layoutChildren = `${w.open}\n          ${layoutChildren}`;
    }
  }

  // Build the App outlet wrapping
  let appChildren = `<Outlet />`;
  for (const w of [...appWrappers].reverse()) {
    appChildren = `${w.open}\n      ${appChildren}\n    ${w.close}`;
  }

  const errorBoundaryContent = config.features.ui && config.uiLibrary === "joy"
    ? `    <Container sx={{ pt: 8, p: 4 }}>
      <Typography level="h1">{message}</Typography>
      <Typography>{details}</Typography>
      {stack && (
        <pre style={{ width: "100%", padding: "16px", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </Container>`
    : `    <div style={{ padding: "2rem" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ width: "100%", padding: "16px", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </div>`;

  return `${imports.join("\n")}
${pluginLine}
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        ${layoutChildren}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    ${appChildren}
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
${errorBoundaryContent}
  );
}
`;
}
```

Create `src/generators/routes-ts.ts`:
```typescript
import type { Config } from "../types";

export function generateRoutesTs(config: Config): string {
  const imports = [`import { type RouteConfig, index, route } from "@react-router/dev/routes";`];
  const routes: string[] = [`  index("routes/_index.tsx"),`];

  if (config.features.auth) {
    routes.push(`  route("login", "routes/login.tsx"),`);
    routes.push(`  route("api/auth/*", "routes/auth.$.tsx"),`);
  }

  if (config.features.admin) {
    routes.push(`  route("admin", "routes/admin.tsx"),`);
  }

  return `${imports.join("\n")}

export default [
${routes.join("\n")}
] satisfies RouteConfig;
`;
}
```

Create `src/generators/dev-vars.ts`:
```typescript
import type { Config } from "../types";

export function generateDevVars(config: Config): string | null {
  const lines: string[] = [];

  if (config.features.email) {
    lines.push(`MAILGUN_API_KEY=test-key`);
  }

  if (lines.length === 0) return null;
  return lines.join("\n") + "\n";
}
```

Create `src/generators/index.ts`:
```typescript
export { mergePackageJsons, stringifyPackageJson } from "./package-json";
export { generateWranglerToml } from "./wrangler-toml";
export { generateEnv } from "./env";
export { generateCfastServer } from "./cfast-server";
export { generateViteConfig } from "./vite-config";
export { generateRootTsx } from "./root-tsx";
export { generateRoutesTs } from "./routes-ts";
export { generateDevVars } from "./dev-vars";
```

**Step 4: Run tests**

```bash
cd packages/create-cfast && pnpm test
```

**Step 5: Commit**

```bash
git add packages/create-cfast/src/generators/ packages/create-cfast/src/__tests__/generators.test.ts
git commit -m "feat(create-cfast): code generators for env, cfast-server, vite-config, root, routes"
```

---

### Task 11: Scaffold Orchestrator

**Files:**
- Create: `packages/create-cfast/src/scaffold.ts`

**Step 1: Implement scaffold.ts**

```typescript
import fs from "node:fs";
import path from "node:path";
import type { Config, FeatureName } from "./types";
import { FEATURE_NAMES } from "./types";
import { copyDir, replaceInDir, readJsonFragment, writeFile, getTemplatesDir } from "./utils";
import {
  mergePackageJsons,
  stringifyPackageJson,
  generateWranglerToml,
  generateEnv,
  generateCfastServer,
  generateViteConfig,
  generateRootTsx,
  generateRoutesTs,
  generateDevVars,
} from "./generators/index";

export function scaffold(config: Config): void {
  const templatesDir = getTemplatesDir();
  const targetDir = path.resolve(process.cwd(), config.targetDir);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Directory "${config.targetDir}" already exists and is not empty.`);
  }

  // 1. Copy base template
  copyDir(path.join(templatesDir, "base"), targetDir);

  // 2. Determine overlay order (auth after db so auth's schema overwrites db's)
  const overlayOrder: FeatureName[] = ["db", "auth", "storage", "email", "ui", "admin"];
  const enabledOverlays = overlayOrder.filter((f) => config.features[f]);

  // 3. Copy overlays
  for (const overlay of enabledOverlays) {
    const overlayDir = path.join(templatesDir, overlay);
    if (fs.existsSync(overlayDir)) {
      copyDir(overlayDir, targetDir);
    }
  }

  // 4. Merge package.json
  const basePackageJson = readJsonFragment(path.join(templatesDir, "base", "package.json"));
  const overlayFragments = enabledOverlays
    .map((overlay) => readJsonFragment(path.join(templatesDir, overlay, "package.json")))
    .filter((f) => Object.keys(f).length > 0);
  const mergedPackageJson = mergePackageJsons(
    basePackageJson as Record<string, unknown>,
    overlayFragments as Record<string, unknown>[],
  );
  writeFile(path.join(targetDir, "package.json"), stringifyPackageJson(mergedPackageJson));

  // 5. Generate files
  writeFile(path.join(targetDir, "wrangler.toml"), generateWranglerToml(config));
  writeFile(path.join(targetDir, "app", "env.ts"), generateEnv(config));
  writeFile(path.join(targetDir, "app", "cfast.server.ts"), generateCfastServer(config));
  writeFile(path.join(targetDir, "vite.config.ts"), generateViteConfig(config));
  writeFile(path.join(targetDir, "app", "root.tsx"), generateRootTsx(config));
  writeFile(path.join(targetDir, "app", "routes.ts"), generateRoutesTs(config));

  const devVars = generateDevVars(config);
  if (devVars) {
    writeFile(path.join(targetDir, ".dev.vars"), devVars);
  }

  // 6. Replace template variables in all files
  replaceInDir(targetDir, {
    projectName: config.projectName,
  });
}
```

**Step 2: Run typecheck**

```bash
cd packages/create-cfast && pnpm typecheck
```

**Step 3: Commit**

```bash
git add packages/create-cfast/src/scaffold.ts
git commit -m "feat(create-cfast): scaffold orchestrator"
```

---

### Task 12: Entry Point + Next Steps Printer

**Files:**
- Modify: `packages/create-cfast/src/index.ts`

**Step 1: Implement the main entry point**

```typescript
#!/usr/bin/env node
import { green, cyan, bold, yellow } from "kolorist";
import { parseArgs, printHelp } from "./args";
import { promptForConfig } from "./prompts";
import type { Config } from "./types";
import { scaffold } from "./scaffold";

function printNextSteps(config: Config): void {
  console.log();
  console.log(green(`✔ Scaffolded ${bold(config.projectName)}/`));
  console.log();
  console.log("  Next steps:");
  console.log(cyan(`    cd ${config.projectName}`));
  console.log(cyan(`    pnpm install`));
  console.log(cyan(`    pnpm dev`));

  if (config.features.db) {
    console.log();
    console.log("  Database (D1 + Drizzle):");
    console.log(cyan(`    pnpm db:generate`));
    console.log(cyan(`    pnpm db:migrate:local`));
  }

  if (config.features.email) {
    console.log();
    console.log("  Email:");
    console.log(`    ${yellow("Edit .dev.vars to set your MAILGUN_API_KEY")}`);
  }

  console.log();
  console.log("  Deploy:");
  console.log(cyan(`    pnpm deploy:staging`));
  console.log(cyan(`    pnpm deploy:production`));
  console.log();
}

async function main(): Promise<void> {
  console.log();
  console.log(bold("  Welcome to cfast!"));
  console.log();

  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const config = await promptForConfig(args);
  if (!config) {
    console.log("Cancelled.");
    return;
  }

  scaffold(config);
  printNextSteps(config);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: Run typecheck and tests**

```bash
cd packages/create-cfast && pnpm typecheck && pnpm test
```

**Step 3: Commit**

```bash
git add packages/create-cfast/src/index.ts
git commit -m "feat(create-cfast): entry point with pipeline and next steps"
```

---

### Task 13: Build, Wire Up, and Verify

**Step 1: Install dependencies**

```bash
cd packages/create-cfast && pnpm install
```

**Step 2: Build**

```bash
cd packages/create-cfast && pnpm build
```

**Step 3: Verify all tests pass**

```bash
cd packages/create-cfast && pnpm test
```

**Step 4: Run typecheck**

```bash
cd packages/create-cfast && pnpm typecheck
```

**Step 5: Manual smoke test — scaffold with all features**

```bash
cd /tmp && node /path/to/packages/create-cfast/dist/index.js test-app --all
```

Verify the output directory has the expected structure:
```bash
ls -la /tmp/test-app/
ls -la /tmp/test-app/app/
ls -la /tmp/test-app/app/routes/
ls -la /tmp/test-app/app/db/
cat /tmp/test-app/package.json
cat /tmp/test-app/wrangler.toml
cat /tmp/test-app/app/env.ts
cat /tmp/test-app/app/cfast.server.ts
cat /tmp/test-app/app/root.tsx
cat /tmp/test-app/app/routes.ts
```

Check:
- [ ] package.json has all @cfast/* dependencies
- [ ] wrangler.toml has D1, R2, KV bindings
- [ ] env.ts has all bindings
- [ ] cfast.server.ts has auth + db plugins
- [ ] root.tsx has Joy UI + AuthClientProvider
- [ ] routes.ts has index, login, auth, admin routes
- [ ] All {{projectName}} replaced with "test-app"
- [ ] .gitignore exists (not _gitignore)
- [ ] .dev.vars has MAILGUN_API_KEY=test-key

**Step 6: Manual smoke test — scaffold with no features**

```bash
cd /tmp && node /path/to/packages/create-cfast/dist/index.js test-minimal
```

Verify minimal output:
- [ ] package.json has only base deps (no drizzle, no better-auth)
- [ ] No wrangler D1/R2/KV bindings
- [ ] env.ts has only APP_URL
- [ ] No auth/db/admin files
- [ ] root.tsx is plain HTML layout

**Step 7: Clean up and commit**

```bash
rm -rf /tmp/test-app /tmp/test-minimal
git add packages/create-cfast/
git commit -m "feat(create-cfast): build configuration and verification"
```
