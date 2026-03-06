# @cfast/env Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement `@cfast/env` — type-safe Cloudflare Worker bindings with runtime validation at startup.

**Architecture:** Single package, zero dependencies. `defineEnv(schema)` returns an object with `init(rawEnv)` (validates once) and `get()` (returns cached typed result). Duck-type checks validate binding objects. An `ENVIRONMENT` binding selects environment-aware defaults.

**Tech Stack:** TypeScript, vitest for testing, tsup for bundling, `@cloudflare/workers-types` as peer dep for CF type references.

---

### Task 1: Add vitest to env package

**Files:**
- Modify: `packages/env/package.json`
- Create: `packages/env/vitest.config.ts`

**Step 1: Install vitest**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm add -D vitest --filter @cfast/env`

**Step 2: Create vitest config**

Create `packages/env/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

**Step 3: Add test script to package.json**

Add `"test": "vitest run"` to `packages/env/package.json` scripts.

**Step 4: Verify vitest runs (no tests yet)**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: vitest runs, reports 0 tests found.

**Step 5: Commit**

```bash
git add packages/env/package.json packages/env/vitest.config.ts packages/env/pnpm-lock.yaml
git commit -m "chore(env): add vitest for testing"
```

---

### Task 2: Types and EnvError

**Files:**
- Create: `packages/env/src/types.ts`
- Create: `packages/env/src/errors.ts`
- Create: `packages/env/src/__tests__/errors.test.ts`

**Step 1: Write the failing test**

Create `packages/env/src/__tests__/errors.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { EnvError } from "../errors";

describe("EnvError", () => {
  it("contains all validation errors", () => {
    const err = new EnvError([
      { key: "DB", message: "Missing required D1 binding 'DB'" },
      { key: "CACHE", message: "Missing required KV binding 'CACHE'" },
    ]);
    expect(err).toBeInstanceOf(Error);
    expect(err.errors).toHaveLength(2);
    expect(err.message).toContain("DB");
    expect(err.message).toContain("CACHE");
  });

  it("has a descriptive message listing all errors", () => {
    const err = new EnvError([
      { key: "X", message: "Missing X" },
    ]);
    expect(err.message).toContain("Missing X");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: FAIL — cannot find module `../errors`

**Step 3: Create types.ts**

Create `packages/env/src/types.ts`:
```typescript
type D1Database = { prepare: Function; dump: Function; batch: Function; exec: Function };
type KVNamespace = { get: Function; put: Function; delete: Function; list: Function };
type R2Bucket = { put: Function; get: Function; head: Function; delete: Function; list: Function };
type Queue = { send: Function; sendBatch: Function };
type DurableObjectNamespace = { get: Function; idFromName: Function; idFromString: Function; newUniqueId: Function };
type Fetcher = { fetch: Function };

export type BindingTypeMap = {
  d1: D1Database;
  kv: KVNamespace;
  r2: R2Bucket;
  queue: Queue;
  "durable-object": DurableObjectNamespace;
  service: Fetcher;
  secret: string;
  var: string;
};

export type BindingType = keyof BindingTypeMap;

export type EnvironmentName = "development" | "staging" | "production";

export type EnvironmentDefaults = Partial<Record<EnvironmentName, string>>;

export type VarBindingDef = {
  type: "var";
  default?: string | EnvironmentDefaults;
  validate?: (value: string) => boolean;
};

export type ObjectBindingDef = {
  type: Exclude<BindingType, "var" | "secret">;
};

export type SecretBindingDef = {
  type: "secret";
};

export type BindingDef = VarBindingDef | ObjectBindingDef | SecretBindingDef;

export type Schema = Record<string, BindingDef>;

export type EnvValidationError = {
  key: string;
  message: string;
};

export type ParsedEnv<S extends Schema> = {
  [K in keyof S]: BindingTypeMap[S[K]["type"]];
};
```

**Step 4: Create errors.ts**

Create `packages/env/src/errors.ts`:
```typescript
import type { EnvValidationError } from "./types";

export class EnvError extends Error {
  readonly errors: EnvValidationError[];

  constructor(errors: EnvValidationError[]) {
    const summary = errors.map((e) => `  - ${e.key}: ${e.message}`).join("\n");
    super(`@cfast/env: ${errors.length} binding error(s):\n${summary}`);
    this.name = "EnvError";
    this.errors = errors;
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/env/src/types.ts packages/env/src/errors.ts packages/env/src/__tests__/errors.test.ts
git commit -m "feat(env): add types and EnvError"
```

---

### Task 3: Validators

**Files:**
- Create: `packages/env/src/validators.ts`
- Create: `packages/env/src/__tests__/validators.test.ts`

**Step 1: Write the failing tests**

Create `packages/env/src/__tests__/validators.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validateBinding } from "../validators";

describe("validateBinding", () => {
  describe("d1", () => {
    it("passes for object with prepare()", () => {
      const fake = { prepare: () => {}, dump: () => {}, batch: () => {}, exec: () => {} };
      expect(validateBinding("DB", { type: "d1" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("DB", { type: "d1" }, undefined);
      expect(result).toEqual({ key: "DB", message: expect.stringContaining("Missing") });
    });

    it("fails for wrong type", () => {
      const result = validateBinding("DB", { type: "d1" }, "not-a-d1");
      expect(result).toEqual({ key: "DB", message: expect.stringContaining("Expected D1") });
    });
  });

  describe("kv", () => {
    it("passes for object with get() and put()", () => {
      const fake = { get: () => {}, put: () => {}, delete: () => {}, list: () => {} };
      expect(validateBinding("CACHE", { type: "kv" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("CACHE", { type: "kv" }, undefined);
      expect(result).toEqual({ key: "CACHE", message: expect.stringContaining("Missing") });
    });
  });

  describe("r2", () => {
    it("passes for object with put() and head()", () => {
      const fake = { put: () => {}, get: () => {}, head: () => {}, delete: () => {}, list: () => {} };
      expect(validateBinding("UPLOADS", { type: "r2" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("UPLOADS", { type: "r2" }, undefined);
      expect(result).toEqual({ key: "UPLOADS", message: expect.stringContaining("Missing") });
    });
  });

  describe("queue", () => {
    it("passes for object with send()", () => {
      const fake = { send: () => {}, sendBatch: () => {} };
      expect(validateBinding("Q", { type: "queue" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("Q", { type: "queue" }, undefined);
      expect(result).toEqual({ key: "Q", message: expect.stringContaining("Missing") });
    });
  });

  describe("durable-object", () => {
    it("passes for object with get() and idFromName()", () => {
      const fake = { get: () => {}, idFromName: () => {}, idFromString: () => {}, newUniqueId: () => {} };
      expect(validateBinding("DO", { type: "durable-object" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("DO", { type: "durable-object" }, undefined);
      expect(result).toEqual({ key: "DO", message: expect.stringContaining("Missing") });
    });
  });

  describe("service", () => {
    it("passes for object with fetch()", () => {
      const fake = { fetch: () => {} };
      expect(validateBinding("SVC", { type: "service" }, fake)).toBeUndefined();
    });

    it("fails for missing binding", () => {
      const result = validateBinding("SVC", { type: "service" }, undefined);
      expect(result).toEqual({ key: "SVC", message: expect.stringContaining("Missing") });
    });
  });

  describe("secret", () => {
    it("passes for non-empty string", () => {
      expect(validateBinding("KEY", { type: "secret" }, "abc123")).toBeUndefined();
    });

    it("fails for empty string", () => {
      const result = validateBinding("KEY", { type: "secret" }, "");
      expect(result).toEqual({ key: "KEY", message: expect.stringContaining("empty") });
    });

    it("fails for missing", () => {
      const result = validateBinding("KEY", { type: "secret" }, undefined);
      expect(result).toEqual({ key: "KEY", message: expect.stringContaining("Missing") });
    });
  });

  describe("var", () => {
    it("passes for string", () => {
      expect(validateBinding("APP_URL", { type: "var" }, "http://localhost")).toBeUndefined();
    });

    it("passes for empty string (empty is allowed for var)", () => {
      expect(validateBinding("APP_URL", { type: "var" }, "")).toBeUndefined();
    });

    it("fails when missing and no default", () => {
      const result = validateBinding("APP_URL", { type: "var" }, undefined);
      expect(result).toEqual({ key: "APP_URL", message: expect.stringContaining("Missing") });
    });

    it("passes when missing but has default", () => {
      expect(validateBinding("APP_URL", { type: "var", default: "http://localhost" }, undefined)).toBeUndefined();
    });

    it("fails when validate returns false", () => {
      const def = { type: "var" as const, validate: (v: string) => v === "yes" };
      const result = validateBinding("FLAG", def, "no");
      expect(result).toEqual({ key: "FLAG", message: expect.stringContaining("failed validation") });
    });

    it("passes when validate returns true", () => {
      const def = { type: "var" as const, validate: (v: string) => v === "yes" };
      expect(validateBinding("FLAG", def, "yes")).toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: FAIL — cannot find module `../validators`

**Step 3: Write the validators**

Create `packages/env/src/validators.ts`:
```typescript
import type { BindingDef, EnvValidationError } from "./types";

const BINDING_LABELS: Record<string, string> = {
  d1: "D1",
  kv: "KV",
  r2: "R2",
  queue: "Queue",
  "durable-object": "DurableObject",
  service: "Service",
  secret: "secret",
  var: "variable",
};

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function hasMethod(obj: Record<string, unknown>, method: string): boolean {
  return typeof obj[method] === "function";
}

const DUCK_CHECKS: Record<string, string[]> = {
  d1: ["prepare"],
  kv: ["get", "put"],
  r2: ["put", "head"],
  queue: ["send"],
  "durable-object": ["get", "idFromName"],
  service: ["fetch"],
};

export function validateBinding(
  key: string,
  def: BindingDef,
  value: unknown,
): EnvValidationError | undefined {
  const label = BINDING_LABELS[def.type] ?? def.type;

  if (def.type === "var") {
    if (value === undefined || value === null) {
      if (def.default !== undefined) return undefined;
      return { key, message: `Missing required variable '${key}'. Check your wrangler.toml.` };
    }
    if (typeof value !== "string") {
      return { key, message: `Expected string for variable '${key}', got ${typeof value}.` };
    }
    if (def.validate && !def.validate(value)) {
      return { key, message: `Variable '${key}' failed validation.` };
    }
    return undefined;
  }

  if (def.type === "secret") {
    if (value === undefined || value === null) {
      return { key, message: `Missing required secret '${key}'. Check your wrangler.toml.` };
    }
    if (typeof value !== "string") {
      return { key, message: `Expected string for secret '${key}', got ${typeof value}.` };
    }
    if (value.length === 0) {
      return { key, message: `Secret '${key}' is empty. Secrets must be non-empty strings.` };
    }
    return undefined;
  }

  // Object bindings: d1, kv, r2, queue, durable-object, service
  if (value === undefined || value === null) {
    return { key, message: `Missing required ${label} binding '${key}'. Check your wrangler.toml.` };
  }

  if (!isObject(value)) {
    return { key, message: `Expected ${label} binding for '${key}', got ${typeof value}.` };
  }

  const methods = DUCK_CHECKS[def.type];
  if (methods) {
    for (const method of methods) {
      if (!hasMethod(value, method)) {
        return {
          key,
          message: `Expected ${label} binding for '${key}' (missing .${method}() method). Check your wrangler.toml.`,
        };
      }
    }
  }

  return undefined;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: PASS — all validator tests green

**Step 5: Commit**

```bash
git add packages/env/src/validators.ts packages/env/src/__tests__/validators.test.ts
git commit -m "feat(env): add binding validators with duck-type checks"
```

---

### Task 4: defineEnv — core init/get logic

**Files:**
- Create: `packages/env/src/define-env.ts`
- Create: `packages/env/src/__tests__/define-env.test.ts`
- Modify: `packages/env/src/index.ts`

**Step 1: Write the failing tests**

Create `packages/env/src/__tests__/define-env.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { defineEnv } from "../define-env";
import { EnvError } from "../errors";

function fakeD1() {
  return { prepare: () => {}, dump: () => {}, batch: () => {}, exec: () => {} };
}

function fakeKV() {
  return { get: () => {}, put: () => {}, delete: () => {}, list: () => {} };
}

describe("defineEnv", () => {
  it("returns an object with init and get", () => {
    const env = defineEnv({ DB: { type: "d1" } });
    expect(typeof env.init).toBe("function");
    expect(typeof env.get).toBe("function");
  });

  describe("init", () => {
    it("validates and caches bindings", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      const rawEnv = { DB: fakeD1() };
      env.init(rawEnv);
      const result = env.get();
      expect(result.DB).toBe(rawEnv.DB);
    });

    it("no-ops on subsequent calls", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      const first = { DB: fakeD1() };
      const second = { DB: fakeD1() };
      env.init(first);
      env.init(second);
      expect(env.get().DB).toBe(first.DB);
    });

    it("throws EnvError with all validation failures", () => {
      const env = defineEnv({
        DB: { type: "d1" },
        CACHE: { type: "kv" },
      });
      expect(() => env.init({})).toThrow(EnvError);
      try {
        env.init({});
      } catch (e) {
        // init already succeeded (no-op), so we need a fresh env
      }
      const env2 = defineEnv({ DB: { type: "d1" }, CACHE: { type: "kv" } });
      try {
        env2.init({});
      } catch (e) {
        expect(e).toBeInstanceOf(EnvError);
        expect((e as EnvError).errors).toHaveLength(2);
      }
    });
  });

  describe("get", () => {
    it("throws if init was not called", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      expect(() => env.get()).toThrow("env.init()");
    });
  });

  describe("var with defaults", () => {
    it("uses simple string default when value is missing", () => {
      const env = defineEnv({
        LOG_LEVEL: { type: "var", default: "info" },
      });
      env.init({});
      expect(env.get().LOG_LEVEL).toBe("info");
    });

    it("uses provided value over default", () => {
      const env = defineEnv({
        LOG_LEVEL: { type: "var", default: "info" },
      });
      env.init({ LOG_LEVEL: "debug" });
      expect(env.get().LOG_LEVEL).toBe("debug");
    });
  });

  describe("environment-aware defaults", () => {
    it("selects default based on ENVIRONMENT binding", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            development: "http://localhost:8787",
            production: "https://myapp.com",
          },
        },
      });
      env.init({ ENVIRONMENT: "production" });
      expect(env.get().APP_URL).toBe("https://myapp.com");
    });

    it("defaults ENVIRONMENT to development", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            development: "http://localhost:8787",
            production: "https://myapp.com",
          },
        },
      });
      env.init({});
      expect(env.get().APP_URL).toBe("http://localhost:8787");
    });

    it("errors when environment has no matching default and no value", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            production: "https://myapp.com",
          },
        },
      });
      expect(() => env.init({ ENVIRONMENT: "development" })).toThrow(EnvError);
    });
  });

  describe("validate callback", () => {
    it("passes when validate returns true", () => {
      const env = defineEnv({
        LOG_LEVEL: {
          type: "var",
          default: "info",
          validate: (v) => ["debug", "info", "warn", "error"].includes(v),
        },
      });
      env.init({});
      expect(env.get().LOG_LEVEL).toBe("info");
    });

    it("fails when validate returns false", () => {
      const env = defineEnv({
        LOG_LEVEL: {
          type: "var",
          validate: (v) => ["debug", "info", "warn", "error"].includes(v),
        },
      });
      expect(() => env.init({ LOG_LEVEL: "verbose" })).toThrow(EnvError);
    });
  });

  describe("multiple bindings", () => {
    it("validates and returns all bindings", () => {
      const env = defineEnv({
        DB: { type: "d1" },
        CACHE: { type: "kv" },
        API_KEY: { type: "secret" },
        APP_URL: { type: "var", default: "http://localhost" },
      });
      const db = fakeD1();
      const kv = fakeKV();
      env.init({ DB: db, CACHE: kv, API_KEY: "sk-123" });
      const result = env.get();
      expect(result.DB).toBe(db);
      expect(result.CACHE).toBe(kv);
      expect(result.API_KEY).toBe("sk-123");
      expect(result.APP_URL).toBe("http://localhost");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: FAIL — cannot find module `../define-env`

**Step 3: Write the implementation**

Create `packages/env/src/define-env.ts`:
```typescript
import type { Schema, ParsedEnv, BindingDef, EnvironmentDefaults, EnvironmentName } from "./types";
import { EnvError } from "./errors";
import { validateBinding } from "./validators";

type Env<S extends Schema> = {
  init(rawEnv: Record<string, unknown>): void;
  get(): ParsedEnv<S>;
};

function resolveDefault(
  def: BindingDef,
  environment: EnvironmentName,
): string | undefined {
  if (def.type !== "var" || def.default === undefined) return undefined;
  if (typeof def.default === "string") return def.default;
  return (def.default as EnvironmentDefaults)[environment];
}

export function defineEnv<S extends Schema>(schema: S): Env<S> {
  let cached: ParsedEnv<S> | null = null;

  return {
    init(rawEnv: Record<string, unknown>) {
      if (cached !== null) return;

      const environment = (
        typeof rawEnv["ENVIRONMENT"] === "string"
          ? rawEnv["ENVIRONMENT"]
          : "development"
      ) as EnvironmentName;

      const errors: { key: string; message: string }[] = [];
      const result: Record<string, unknown> = {};

      for (const [key, def] of Object.entries(schema)) {
        let value = rawEnv[key];

        // Apply defaults for var bindings
        if (value === undefined || value === null) {
          const defaultValue = resolveDefault(def, environment);
          if (defaultValue !== undefined) {
            value = defaultValue;
          }
        }

        const error = validateBinding(key, def, value);
        if (error) {
          errors.push(error);
        } else {
          result[key] = value;
        }
      }

      if (errors.length > 0) {
        throw new EnvError(errors);
      }

      cached = result as ParsedEnv<S>;
    },

    get(): ParsedEnv<S> {
      if (cached === null) {
        throw new Error(
          "@cfast/env: Environment not initialized. Call env.init(rawEnv) before env.get().",
        );
      }
      return cached;
    },
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add packages/env/src/define-env.ts packages/env/src/__tests__/define-env.test.ts
git commit -m "feat(env): implement defineEnv with init/get pattern"
```

---

### Task 5: Wire up public API and build

**Files:**
- Modify: `packages/env/src/index.ts`

**Step 1: Update index.ts to export public API**

Replace `packages/env/src/index.ts` with:
```typescript
export { defineEnv } from "./define-env";
export { EnvError } from "./errors";
export type {
  BindingDef,
  BindingType,
  BindingTypeMap,
  EnvironmentDefaults,
  EnvironmentName,
  EnvValidationError,
  ParsedEnv,
  Schema,
  VarBindingDef,
  ObjectBindingDef,
  SecretBindingDef,
} from "./types";
```

**Step 2: Run all tests**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm test`
Expected: PASS

**Step 3: Build the package**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm build`
Expected: tsup succeeds, outputs `dist/index.js` and `dist/index.d.ts`

**Step 4: Typecheck**

Run: `cd /Users/danielschmidt/fun/cfast/packages/env && pnpm typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/env/src/index.ts
git commit -m "feat(env): wire up public API exports"
```

---

### Task 6: Run agents for quality checks

Per CLAUDE.md, run the following agents after implementation:

**Step 1: Run workers-compat agent**

Spawn `.claude/agents/workers-compat.md` with Haiku to verify no Node.js APIs are used.

**Step 2: Run api-reviewer agent**

Spawn `.claude/agents/api-reviewer.md` with Sonnet to review the public API.

**Step 3: Run package-boundary agent**

Spawn `.claude/agents/package-boundary.md` with Haiku to verify exports and dependencies.

**Step 4: Run readme-sync agent**

Spawn `.claude/agents/readme-sync.md` with Sonnet to verify implementation matches README.

**Step 5: Fix any issues found, then commit**

```bash
git add -A packages/env/
git commit -m "fix(env): address agent review feedback"
```
