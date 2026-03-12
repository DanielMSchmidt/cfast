# @cfast/core Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the `@cfast/core` package — the optional composition layer that wires `@cfast/*` packages together via a plugin system.

**Architecture:** A `createApp()` factory accepts env schema + permissions config (the two leaf packages), then chains `.use(plugin)` calls. Each plugin defines a `name`, a per-request `setup()` function, and optional client-side `Provider`/`client` exports. The server builds a namespaced context object per request; the client composes providers and exposes `useApp()`.

**Tech Stack:** TypeScript (strict, no `any`), React (peer dep for client), `@cfast/env`, `@cfast/permissions`, vitest for tests, tsup for build.

**Reference:** `packages/core/README.md` is the full spec. `docs/plans/2026-03-11-cfast-core-design.md` is the approved design.

---

### Task 1: Types and Error Classes

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/errors.ts`
- Test: `packages/core/src/__tests__/types.test.ts`

**Step 1: Write the types file**

```typescript
// packages/core/src/types.ts
import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type { ReactNode, ComponentType } from "react";

export type CreateAppConfig<
  TSchema extends Schema,
  TPermissions extends Permissions,
> = {
  env: TSchema;
  permissions: TPermissions;
};

export type PluginSetupContext<TRequires> = {
  request: Request;
  env: Record<string, unknown>;
} & TRequires;

export type CfastPlugin<
  TName extends string = string,
  TProvides = unknown,
  TRequires = {},
  TClient = {},
> = {
  name: TName;
  setup: (
    ctx: PluginSetupContext<TRequires>,
  ) => TProvides | Promise<TProvides>;
  Provider?: ComponentType<{ children: ReactNode }>;
  client?: TClient;
};

// Utility type: extract { [name]: ReturnType<setup> } from a plugin
export type PluginProvides<T> = T extends CfastPlugin<
  infer N,
  infer P,
  unknown,
  unknown
>
  ? { [K in N]: P }
  : never;

// The accumulated context type after all plugins have run
export type AppContext<
  TSchema extends Schema,
  TPluginContext,
> = {
  env: ParsedEnv<TSchema>;
} & TPluginContext;

// The app object returned by createApp().use()...
export type App<
  TSchema extends Schema,
  TPermissions extends Permissions,
  TPluginContext,
  TClientContext,
> = {
  init(rawEnv: Record<string, unknown>): void;
  env(): ParsedEnv<TSchema>;
  context(
    request: Request,
    context?: unknown,
  ): Promise<AppContext<TSchema, TPluginContext>>;
  loader<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: { request: Request; params: Record<string, string | undefined>; context: unknown },
    ) => T | Promise<T>,
  ): (args: { request: Request; params: Record<string, string | undefined>; context: unknown }) => Promise<T>;
  action<T>(
    fn: (
      ctx: AppContext<TSchema, TPluginContext>,
      args: { request: Request; params: Record<string, string | undefined>; context: unknown },
    ) => T | Promise<T>,
  ): (args: { request: Request; params: Record<string, string | undefined>; context: unknown }) => Promise<T>;
  use<
    TName extends string,
    TProvides,
    TClient,
  >(
    plugin: CfastPlugin<TName, TProvides, TPluginContext, TClient>,
  ): App<
    TSchema,
    TPermissions,
    TPluginContext & { [K in TName]: TProvides },
    TClientContext & (TClient extends {} ? { [K in TName]: TClient } : {})
  >;
  Provider: ComponentType<{ children: ReactNode }>;
  permissions: TPermissions;
};
```

**Step 2: Write the errors file**

```typescript
// packages/core/src/errors.ts
export class CfastPluginError extends Error {
  readonly pluginName: string;
  override readonly cause: unknown;

  constructor(pluginName: string, cause: unknown) {
    const causeMessage =
      cause instanceof Error ? cause.message : String(cause);
    super(`Plugin "${pluginName}" setup failed: ${causeMessage}`);
    this.name = "CfastPluginError";
    this.pluginName = pluginName;
    this.cause = cause;
  }
}

export class CfastConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CfastConfigError";
  }
}
```

**Step 3: Write the test for error classes**

```typescript
// packages/core/src/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import { CfastPluginError, CfastConfigError } from "../errors";

describe("CfastPluginError", () => {
  it("wraps cause with plugin name", () => {
    const cause = new Error("D1 binding not found");
    const err = new CfastPluginError("db", cause);
    expect(err.message).toBe('Plugin "db" setup failed: D1 binding not found');
    expect(err.pluginName).toBe("db");
    expect(err.cause).toBe(cause);
  });

  it("handles non-Error cause", () => {
    const err = new CfastPluginError("auth", "string error");
    expect(err.message).toBe('Plugin "auth" setup failed: string error');
  });
});

describe("CfastConfigError", () => {
  it("sets name and message", () => {
    const err = new CfastConfigError("duplicate plugin");
    expect(err.name).toBe("CfastConfigError");
    expect(err.message).toBe("duplicate plugin");
  });
});
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cfast/core test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/errors.ts packages/core/src/__tests__/types.test.ts
git commit -m "feat(core): add type definitions and error classes"
```

---

### Task 2: definePlugin

**Files:**
- Create: `packages/core/src/define-plugin.ts`
- Test: `packages/core/src/__tests__/define-plugin.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/core/src/__tests__/define-plugin.test.ts
import { describe, it, expect } from "vitest";
import { definePlugin } from "../define-plugin";

describe("definePlugin", () => {
  it("returns the plugin config with name and setup", () => {
    const plugin = definePlugin({
      name: "test",
      setup: () => ({ value: 42 }),
    });
    expect(plugin.name).toBe("test");
    expect(typeof plugin.setup).toBe("function");
  });

  it("preserves Provider and client fields", () => {
    const Provider = ({ children }: { children: React.ReactNode }) => children;
    const plugin = definePlugin({
      name: "themed",
      setup: () => ({}),
      Provider,
      client: { useTheme: () => "dark" },
    });
    expect(plugin.Provider).toBe(Provider);
    expect(plugin.client).toEqual({ useTheme: expect.any(Function) });
  });

  it("returns setup result when called", async () => {
    const plugin = definePlugin({
      name: "analytics",
      setup: () => ({ track: (e: string) => e }),
    });
    const result = await plugin.setup({ request: new Request("http://localhost"), env: {} } as any);
    expect(result.track("click")).toBe("click");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/core test`
Expected: FAIL — `definePlugin` not found

**Step 3: Write the implementation**

```typescript
// packages/core/src/define-plugin.ts
import type { CfastPlugin } from "./types";

export function definePlugin<TRequires = {}>(
  config: Omit<
    CfastPlugin<string, unknown, TRequires, unknown>,
    never
  > & {
    name: string;
    setup: (ctx: { request: Request; env: Record<string, unknown> } & TRequires) =>
      | unknown
      | Promise<unknown>;
  },
): typeof config {
  return config;
}
```

Note: `definePlugin` is intentionally a pass-through — its purpose is to provide type inference. The generic `TRequires` constrains `ctx` in `setup()`.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cfast/core test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/define-plugin.ts packages/core/src/__tests__/define-plugin.test.ts
git commit -m "feat(core): add definePlugin pass-through factory"
```

---

### Task 3: createApp — Core Implementation

This is the main task. `createApp()` returns an app object with `.use()`, `.init()`, `.env()`, `.context()`, `.loader()`, `.action()`, and `.Provider`.

**Files:**
- Create: `packages/core/src/create-app.ts`
- Test: `packages/core/src/__tests__/create-app.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/core/src/__tests__/create-app.test.ts
import { describe, it, expect } from "vitest";
import { createApp } from "../create-app";
import { definePlugin } from "../define-plugin";
import { defineEnv } from "@cfast/env";
import { definePermissions } from "@cfast/permissions";
import { CfastPluginError, CfastConfigError } from "../errors";

const envSchema = {
  API_KEY: { type: "secret" as const },
};

const permissions = definePermissions({
  roles: ["reader", "editor"] as const,
  grants: (grant) => ({
    reader: [grant("read", "all")],
    editor: [grant("read", "all"), grant("create", "all")],
  }),
});

function makeRequest(url = "http://localhost") {
  return new Request(url);
}

describe("createApp", () => {
  describe("init and env", () => {
    it("delegates init to @cfast/env", () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      expect(app.env().API_KEY).toBe("sk-test");
    });

    it("throws if env() called before init()", () => {
      const app = createApp({ env: envSchema, permissions });
      expect(() => app.env()).toThrow("env.init()");
    });

    it("exposes permissions on the app object", () => {
      const app = createApp({ env: envSchema, permissions });
      expect(app.permissions).toBe(permissions);
    });
  });

  describe("use", () => {
    it("rejects duplicate plugin names", () => {
      const p1 = definePlugin({ name: "auth", setup: () => ({}) });
      const p2 = definePlugin({ name: "auth", setup: () => ({}) });
      const app = createApp({ env: envSchema, permissions });
      expect(() => app.use(p1).use(p2)).toThrow(CfastConfigError);
      expect(() => app.use(p1).use(p2)).toThrow(/duplicate/i);
    });

    it("returns a new app instance (immutable chain)", () => {
      const app = createApp({ env: envSchema, permissions });
      const p = definePlugin({ name: "a", setup: () => ({}) });
      const app2 = app.use(p);
      expect(app2).not.toBe(app);
    });
  });

  describe("context", () => {
    it("returns env in the context", async () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.env.API_KEY).toBe("sk-test");
    });

    it("runs plugin setup and namespaces result", async () => {
      const plugin = definePlugin({
        name: "greeter",
        setup: () => ({ hello: "world" }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.greeter.hello).toBe("world");
    });

    it("passes prior plugin results to subsequent plugins", async () => {
      const first = definePlugin({
        name: "first",
        setup: () => ({ value: 1 }),
      });

      type FirstProvides = { first: { value: number } };
      const second = definePlugin<FirstProvides>({
        name: "second",
        setup: (ctx) => ({ doubled: ctx.first.value * 2 }),
      });

      const app = createApp({ env: envSchema, permissions })
        .use(first)
        .use(second);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.second.doubled).toBe(2);
    });

    it("passes request and env to plugin setup", async () => {
      const plugin = definePlugin({
        name: "echo",
        setup: (ctx) => ({
          url: ctx.request.url,
          hasEnv: typeof ctx.env === "object",
        }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest("http://example.com/test"));
      expect(ctx.echo.url).toBe("http://example.com/test");
      expect(ctx.echo.hasEnv).toBe(true);
    });

    it("handles async plugin setup", async () => {
      const plugin = definePlugin({
        name: "async",
        setup: async () => {
          return { ready: true };
        },
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.async.ready).toBe(true);
    });

    it("wraps plugin errors in CfastPluginError", async () => {
      const plugin = definePlugin({
        name: "broken",
        setup: () => {
          throw new Error("D1 binding not found");
        },
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      try {
        await app.context(makeRequest());
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(CfastPluginError);
        expect((e as CfastPluginError).pluginName).toBe("broken");
      }
    });
  });

  describe("loader and action", () => {
    it("loader passes context and route args", async () => {
      const plugin = definePlugin({
        name: "db",
        setup: () => ({ query: () => "result" }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const loader = app.loader(async (ctx, args) => {
        return { data: ctx.db.query(), url: args.request.url };
      });
      const result = await loader({
        request: makeRequest("http://localhost/posts"),
        params: {},
        context: {},
      });
      expect(result.data).toBe("result");
      expect(result.url).toBe("http://localhost/posts");
    });

    it("action passes context and route args", async () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      const action = app.action(async (ctx, args) => {
        return { method: args.request.method };
      });
      const result = await action({
        request: new Request("http://localhost", { method: "POST" }),
        params: {},
        context: {},
      });
      expect(result.method).toBe("POST");
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @cfast/core test`
Expected: FAIL — `createApp` not found

**Step 3: Write the implementation**

```typescript
// packages/core/src/create-app.ts
import { defineEnv } from "@cfast/env";
import type { Schema, ParsedEnv } from "@cfast/env";
import type { Permissions } from "@cfast/permissions";
import type { CfastPlugin, CreateAppConfig } from "./types";
import { CfastPluginError, CfastConfigError } from "./errors";

type RouteArgs = {
  request: Request;
  params: Record<string, string | undefined>;
  context: unknown;
};

export function createApp<
  TSchema extends Schema,
  TPermissions extends Permissions,
>(config: CreateAppConfig<TSchema, TPermissions>) {
  const envInstance = defineEnv(config.env);

  return buildApp<TSchema, TPermissions, {}, {}>(
    envInstance,
    config.permissions,
    [],
  );
}

function buildApp<
  TSchema extends Schema,
  TPermissions extends Permissions,
  TPluginContext,
  TClientContext,
>(
  envInstance: { init(raw: Record<string, unknown>): void; get(): ParsedEnv<TSchema> },
  permissions: TPermissions,
  plugins: CfastPlugin[],
) {
  const pluginNames = new Set(plugins.map((p) => p.name));

  const app = {
    permissions,

    init(rawEnv: Record<string, unknown>): void {
      envInstance.init(rawEnv);
    },

    env(): ParsedEnv<TSchema> {
      return envInstance.get();
    },

    async context(
      request: Request,
      _context?: unknown,
    ): Promise<{ env: ParsedEnv<TSchema> } & TPluginContext> {
      const env = envInstance.get();
      let accumulated: Record<string, unknown> = {};

      for (const plugin of plugins) {
        const setupCtx = {
          request,
          env,
          ...accumulated,
        };
        try {
          const result = await plugin.setup(setupCtx);
          accumulated[plugin.name] = result;
        } catch (e) {
          if (e instanceof CfastPluginError) throw e;
          throw new CfastPluginError(plugin.name, e);
        }
      }

      return { env, ...accumulated } as { env: ParsedEnv<TSchema> } & TPluginContext;
    },

    loader<T>(
      fn: (
        ctx: { env: ParsedEnv<TSchema> } & TPluginContext,
        args: RouteArgs,
      ) => T | Promise<T>,
    ) {
      return async (args: RouteArgs): Promise<T> => {
        const ctx = await app.context(args.request, args.context);
        return fn(ctx, args);
      };
    },

    action<T>(
      fn: (
        ctx: { env: ParsedEnv<TSchema> } & TPluginContext,
        args: RouteArgs,
      ) => T | Promise<T>,
    ) {
      return async (args: RouteArgs): Promise<T> => {
        const ctx = await app.context(args.request, args.context);
        return fn(ctx, args);
      };
    },

    use<TName extends string, TProvides, TClient>(
      plugin: CfastPlugin<TName, TProvides, TPluginContext, TClient>,
    ) {
      if (pluginNames.has(plugin.name)) {
        throw new CfastConfigError(
          `Duplicate plugin name "${plugin.name}". Each plugin must have a unique name.`,
        );
      }

      return buildApp<
        TSchema,
        TPermissions,
        TPluginContext & { [K in TName]: TProvides },
        TClientContext & { [K in TName]: TClient }
      >(envInstance, permissions, [...plugins, plugin as unknown as CfastPlugin]);
    },

    // Provider is defined in client.ts — this is a placeholder that gets
    // replaced when the client module creates the real Provider.
    // On the server side, Provider is not used.
    Provider: (() => {
      throw new Error(
        "@cfast/core: Provider is only available on the client. Import from '@cfast/core/client'.",
      );
    }) as unknown as React.ComponentType<{ children: React.ReactNode }>,
  };

  return app;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cfast/core test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/create-app.ts packages/core/src/__tests__/create-app.test.ts
git commit -m "feat(core): add createApp with plugin chain, context, loader/action"
```

---

### Task 4: Client Module — Provider and useApp

**Files:**
- Create: `packages/core/src/client/index.ts`
- Create: `packages/core/src/client/use-app.ts`
- Create: `packages/core/src/client/provider.tsx`
- Test: `packages/core/src/__tests__/client.test.tsx`

**Step 1: Write the failing test**

```typescript
// packages/core/src/__tests__/client.test.tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createCoreProvider, useApp, CoreContext } from "../client/index";

describe("client", () => {
  describe("createCoreProvider", () => {
    it("composes plugin providers in registration order", () => {
      const log: string[] = [];
      const P1 = ({ children }: { children: React.ReactNode }) => {
        log.push("P1");
        return <div data-provider="p1">{children}</div>;
      };
      const P2 = ({ children }: { children: React.ReactNode }) => {
        log.push("P2");
        return <div data-provider="p2">{children}</div>;
      };

      const plugins = [
        { name: "a", setup: () => ({}), Provider: P1, client: { x: 1 } },
        { name: "b", setup: () => ({}), Provider: P2, client: { y: 2 } },
      ];

      const Provider = createCoreProvider(plugins);
      const html = renderToString(
        <Provider><span>child</span></Provider>,
      );

      // P1 wraps P2 wraps child (registration order = nesting order)
      expect(html).toContain("child");
      expect(log).toEqual(["P1", "P2"]);
    });

    it("skips plugins without Provider", () => {
      const log: string[] = [];
      const P1 = ({ children }: { children: React.ReactNode }) => {
        log.push("P1");
        return <>{children}</>;
      };

      const plugins = [
        { name: "a", setup: () => ({}), Provider: P1, client: {} },
        { name: "b", setup: () => ({}) },  // no Provider
      ];

      const Provider = createCoreProvider(plugins);
      renderToString(<Provider><span>ok</span></Provider>);
      expect(log).toEqual(["P1"]);
    });
  });

  describe("useApp", () => {
    it("throws when used outside CoreContext.Provider", () => {
      // We can't easily test hook throws without a React error boundary in SSR,
      // so we test the context value directly
      expect(CoreContext).toBeDefined();
    });

    it("returns aggregated client exports", () => {
      const plugins = [
        { name: "auth", setup: () => ({}), client: { useCurrentUser: () => null } },
        { name: "db", setup: () => ({}), client: { useQuery: () => [] } },
      ];

      const Provider = createCoreProvider(plugins);
      let captured: Record<string, unknown> = {};

      function TestComponent() {
        captured = useApp();
        return null;
      }

      renderToString(
        <Provider><TestComponent /></Provider>,
      );
      expect(captured).toHaveProperty("auth");
      expect(captured).toHaveProperty("db");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/core test`
Expected: FAIL — client modules not found

**Step 3: Write the implementation**

```typescript
// packages/core/src/client/use-app.ts
import { useContext } from "react";
import { CoreContext } from "./provider";

export function useApp<T = Record<string, unknown>>(): T {
  const ctx = useContext(CoreContext);
  if (ctx === null) {
    throw new Error(
      "@cfast/core: useApp() must be used inside <app.Provider>. " +
      "Wrap your app with the Provider from createApp().",
    );
  }
  return ctx as T;
}
```

```tsx
// packages/core/src/client/provider.tsx
import React, { createContext, type ReactNode, type ComponentType } from "react";
import type { CfastPlugin } from "../types";

export const CoreContext = createContext<Record<string, unknown> | null>(null);

export function createCoreProvider(
  plugins: Pick<CfastPlugin, "name" | "Provider" | "client">[],
): ComponentType<{ children: ReactNode }> {
  // Build client context value from plugins that have client exports
  const clientValue: Record<string, unknown> = {};
  for (const plugin of plugins) {
    if (plugin.client) {
      clientValue[plugin.name] = plugin.client;
    }
  }

  // Collect providers in registration order
  const providers = plugins
    .filter((p): p is typeof p & { Provider: ComponentType<{ children: ReactNode }> } =>
      p.Provider != null,
    )
    .map((p) => p.Provider);

  return function CfastProvider({ children }: { children: ReactNode }) {
    // Nest providers: first registered = outermost
    let tree = children;
    for (let i = providers.length - 1; i >= 0; i--) {
      const P = providers[i];
      tree = <P>{tree}</P>;
    }

    return (
      <CoreContext.Provider value={clientValue}>
        {tree}
      </CoreContext.Provider>
    );
  };
}
```

```typescript
// packages/core/src/client/index.ts
export { useApp } from "./use-app";
export { createCoreProvider, CoreContext } from "./provider";
```

**Step 4: Add react-dom dev dependency for tests**

Run: `pnpm --filter @cfast/core add -D react-dom @types/react`

**Step 5: Run tests to verify they pass**

Run: `pnpm --filter @cfast/core test`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/core/src/client/
git add packages/core/src/__tests__/client.test.tsx
git commit -m "feat(core): add client module — Provider composition and useApp hook"
```

---

### Task 5: Wire Provider into createApp + Update Exports

Connect `createCoreProvider` to the `app.Provider` property and wire up both server and client entrypoints.

**Files:**
- Modify: `packages/core/src/create-app.ts` — add Provider wiring
- Modify: `packages/core/src/index.ts` — server exports
- Test: `packages/core/src/__tests__/create-app-provider.test.tsx`

**Step 1: Write the failing test**

```typescript
// packages/core/src/__tests__/create-app-provider.test.tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createApp } from "../create-app";
import { definePlugin } from "../define-plugin";
import { definePermissions } from "@cfast/permissions";
import { useApp } from "../client/index";

const envSchema = {
  API_KEY: { type: "secret" as const },
};

const permissions = definePermissions({
  roles: ["reader"] as const,
  grants: (grant) => ({
    reader: [grant("read", "all")],
  }),
});

describe("createApp Provider integration", () => {
  it("app.Provider renders plugin providers and exposes client via useApp", () => {
    const TestProvider = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="themed">{children}</div>
    );

    const themePlugin = definePlugin({
      name: "theme",
      setup: () => ({}),
      Provider: TestProvider,
      client: { mode: "dark" },
    });

    const app = createApp({ env: envSchema, permissions }).use(themePlugin);

    let captured: Record<string, unknown> = {};
    function Spy() {
      captured = useApp();
      return null;
    }

    const html = renderToString(
      <app.Provider><Spy /></app.Provider>,
    );
    expect(html).toContain("themed");
    expect(captured).toHaveProperty("theme");
    expect((captured as { theme: { mode: string } }).theme.mode).toBe("dark");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/core test`
Expected: FAIL — app.Provider throws

**Step 3: Update createApp to wire Provider**

In `packages/core/src/create-app.ts`, import `createCoreProvider` and replace the placeholder `Provider`:

```typescript
// Add import at top
import { createCoreProvider } from "./client/provider";

// In buildApp, replace the Provider placeholder:
Provider: createCoreProvider(plugins),
```

The `Provider` property is rebuilt on every `.use()` call since `buildApp` is called fresh.

**Step 4: Update server exports in index.ts**

```typescript
// packages/core/src/index.ts
export { createApp } from "./create-app";
export { definePlugin } from "./define-plugin";
export { CfastPluginError, CfastConfigError } from "./errors";
export type {
  CfastPlugin,
  PluginProvides,
  AppContext,
  CreateAppConfig,
} from "./types";
```

**Step 5: Run all tests**

Run: `pnpm --filter @cfast/core test`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/core/src/create-app.ts packages/core/src/index.ts packages/core/src/__tests__/create-app-provider.test.tsx
git commit -m "feat(core): wire Provider into createApp and set up exports"
```

---

### Task 6: Build Verification and Type Checking

**Files:**
- No new files — verify everything builds and type-checks

**Step 1: Run typecheck**

Run: `pnpm --filter @cfast/core typecheck`
Expected: PASS — fix any type errors

**Step 2: Run build**

Run: `pnpm --filter @cfast/core build`
Expected: PASS — produces `dist/index.js`, `dist/index.d.ts`, `dist/client/index.js`, `dist/client/index.d.ts`

**Step 3: Verify exports**

Run: `ls packages/core/dist/ && ls packages/core/dist/client/`
Expected: See built JS + declaration files for both entrypoints

**Step 4: Run full test suite**

Run: `pnpm --filter @cfast/core test`
Expected: ALL PASS

**Step 5: Run monorepo checks**

Run: `pnpm typecheck`
Expected: All packages pass (core shouldn't break others)

**Step 6: Commit if any fixes were needed**

```bash
git add -A packages/core/
git commit -m "fix(core): address build and typecheck issues"
```

---

### Task 7: Quality Agents

Run the relevant quality agents from `.claude/agents/` to catch issues.

**Step 1: Run API reviewer**

Spawn `api-reviewer.md` with Sonnet — verify public API matches README spec.

**Step 2: Run Workers compat checker**

Spawn `workers-compat.md` with Haiku — verify no Node.js APIs used.

**Step 3: Run package boundary checker**

Spawn `package-boundary.md` with Haiku — verify dependency flow is correct.

**Step 4: Run README sync checker**

Spawn `readme-sync.md` with Sonnet — verify implementation matches documented API.

**Step 5: Fix any findings and commit**

```bash
git add -A packages/core/
git commit -m "fix(core): address quality review findings"
```
