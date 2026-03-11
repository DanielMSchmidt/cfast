# @cfast/actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a full-stack, type-safe action system with factory-configured context, permission-aware route handlers, loader-injected permissions, and client hooks.

**Architecture:** App-level `createActions()` factory configures context once, producing `createAction` and `composeActions`. Each action definition returns an object with `.action` (route handler), `.loader()` (permission-injecting wrapper), and `.client` (descriptor for `useActions` hook). Permissions flow from `@cfast/db` Operation descriptors through loader data to client booleans.

**Tech Stack:** TypeScript, React, React Router v7, @cfast/db (Operation/compose), @cfast/permissions (Grant/PermissionDescriptor/checkOperationPermissions)

---

### Task 1: Core Types and `createActions` Factory

**Files:**
- Create: `packages/actions/src/types.ts`
- Create: `packages/actions/src/create-actions.ts`
- Modify: `packages/actions/src/index.ts`
- Modify: `packages/actions/package.json`
- Create: `packages/actions/src/__tests__/create-actions.test.ts`
- Create: `packages/actions/vitest.config.ts`
- Create: `packages/actions/tsconfig.json`

**Context:** The factory receives a `getContext` function that transforms a React Router request into the app's context (db, user, grants). It returns `createAction` and `composeActions` functions that share the context type.

**Key types from existing packages:**
- `Operation<TResult> = { permissions: PermissionDescriptor[]; run: (params: Record<string, unknown>) => Promise<TResult> }` (from `@cfast/db`)
- `Grant = { action: PermissionAction; subject: DrizzleTable | "all"; where?: WhereClause }` (from `@cfast/permissions`)
- `PermissionDescriptor = { action: PermissionAction; table: DrizzleTable }` (from `@cfast/permissions`)

**Step 1: Add dependencies to package.json**

Add `@cfast/db` as a dependency (needed for Operation type). Add `vitest`, `@cfast/permissions`, `@cfast/db` as dev deps. Add test script. Add `react-router` to peer deps.

```json
{
  "dependencies": {
    "@cfast/permissions": "workspace:*",
    "@cfast/db": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-router": ">=7"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260305.1",
    "react": "^19.0.0",
    "react-router": "^7.6.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  }
}
```

**Step 2: Create tsconfig.json and vitest.config.ts**

`packages/actions/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

`packages/actions/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});
```

**Step 3: Define core types**

`packages/actions/src/types.ts`:
```typescript
import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";

// JSON-serializable constraint
export type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };

// Context returned by the app's getContext function
export type ActionContext<TUser = unknown> = {
  db: Db;
  user: TUser;
  grants: Grant[];
};

// What getContext receives (subset of React Router's LoaderFunctionArgs/ActionFunctionArgs)
export type RequestArgs = {
  request: Request;
  params: Record<string, string | undefined>;
  context?: unknown;
};

// Factory config
export type ActionsConfig<TUser> = {
  getContext: (args: RequestArgs) => Promise<ActionContext<TUser>>;
};

// The operations function that defines what an action does
export type OperationsFn<TInput, TResult, TUser> = (
  db: Db,
  input: TInput,
  ctx: { user: TUser; request: Request; params: Record<string, string | undefined> },
) => Operation<TResult>;

// Permission status for a single action (sent to client via loader data)
export type ActionPermissionStatus = {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
};

// The _actionPermissions object injected into loader data
export type ActionPermissionsMap = Record<string, ActionPermissionStatus>;

// Client descriptor — carries action names and permission key for useActions
export type ClientDescriptor = {
  readonly _brand: "ActionClientDescriptor";
  readonly actionNames: readonly string[];
  readonly permissionsKey: string;
};

// What createAction returns
export type ActionDefinition<TInput extends Serializable, TResult, TUser> = {
  /** React Router action handler */
  action: (args: RequestArgs) => Promise<TResult>;
  /** Wrap a loader to inject permission status */
  loader: <TLoaderData>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  /** Client descriptor for useActions */
  client: ClientDescriptor;
  /** Get the Operation for testing/introspection (without executing) */
  buildOperation: (db: Db, input: TInput, ctx: { user: TUser; request: Request; params: Record<string, string | undefined> }) => Operation<TResult>;
};

// What composeActions returns
export type ComposedActions<TActions extends Record<string, ActionDefinition<any, any, any>>> = {
  action: (args: RequestArgs) => Promise<unknown>;
  loader: <TLoaderData>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  client: ClientDescriptor;
};
```

**Step 4: Write test for createActions factory**

`packages/actions/src/__tests__/create-actions.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { createActions } from "../create-actions";
import type { ActionContext, RequestArgs } from "../types";

function createMockContext(): ActionContext<{ id: string }> {
  return {
    db: {} as any,
    user: { id: "user-1" },
    grants: [],
  };
}

describe("createActions", () => {
  it("returns createAction and composeActions functions", () => {
    const { createAction, composeActions } = createActions({
      getContext: async () => createMockContext(),
    });

    expect(typeof createAction).toBe("function");
    expect(typeof composeActions).toBe("function");
  });

  it("createAction returns an action definition with action, loader, client, buildOperation", () => {
    const { createAction } = createActions({
      getContext: async () => createMockContext(),
    });

    const myAction = createAction<{ id: string }, void>(
      (db, input, ctx) => ({
        permissions: [],
        run: async () => {},
      }),
    );

    expect(typeof myAction.action).toBe("function");
    expect(typeof myAction.loader).toBe("function");
    expect(myAction.client).toBeDefined();
    expect(myAction.client._brand).toBe("ActionClientDescriptor");
    expect(typeof myAction.buildOperation).toBe("function");
  });
});
```

**Step 5: Implement createActions factory**

`packages/actions/src/create-actions.ts`:
```typescript
import type {
  ActionsConfig,
  ActionDefinition,
  ActionPermissionsMap,
  ActionPermissionStatus,
  ClientDescriptor,
  ComposedActions,
  OperationsFn,
  RequestArgs,
  Serializable,
} from "./types";
import type { Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";

function checkPermissionStatus(
  grants: Grant[],
  descriptors: PermissionDescriptor[],
): ActionPermissionStatus {
  if (descriptors.length === 0) {
    return { permitted: true, invisible: false, reason: null };
  }

  for (const desc of descriptors) {
    const hasGrant = grants.some((g) => {
      const actionMatch =
        g.action === "manage" || g.action === desc.action;
      const subjectMatch = g.subject === "all" || g.subject === desc.table;
      return actionMatch && subjectMatch;
    });

    if (!hasGrant) {
      const tableName = (desc.table as { _: { name: string } })._.name;
      return {
        permitted: false,
        invisible: true,
        reason: `Cannot ${desc.action} on '${tableName}'`,
      };
    }
  }

  return { permitted: true, invisible: false, reason: null };
}

let actionCounter = 0;

export function createActions<TUser>(config: ActionsConfig<TUser>) {
  function createAction<TInput extends Serializable, TResult = void>(
    operationsFn: OperationsFn<TInput, TResult, TUser>,
  ): ActionDefinition<TInput, TResult, TUser> {
    const actionId = `action_${++actionCounter}`;

    function buildOperation(
      db: Parameters<typeof operationsFn>[0],
      input: TInput,
      ctx: Parameters<typeof operationsFn>[2],
    ): Operation<TResult> {
      return operationsFn(db, input, ctx);
    }

    async function action(args: RequestArgs): Promise<TResult> {
      const appCtx = await config.getContext(args);
      const formData = await args.request.clone().formData();

      const input = Object.fromEntries(
        [...formData.entries()].filter(([k]) => k !== "_action"),
      ) as unknown as TInput;

      const op = buildOperation(appCtx.db, input, {
        user: appCtx.user,
        request: args.request,
        params: args.params,
      });

      return op.run({});
    }

    function loader<TLoaderData>(
      loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
    ) {
      return async (args: RequestArgs) => {
        const [data, appCtx] = await Promise.all([
          loaderFn(args),
          config.getContext(args),
        ]);

        const op = buildOperation(appCtx.db, {} as TInput, {
          user: appCtx.user,
          request: args.request,
          params: args.params,
        });

        const permissions: ActionPermissionsMap = {
          [actionId]: checkPermissionStatus(appCtx.grants, op.permissions),
        };

        return { ...data, _actionPermissions: permissions };
      };
    }

    const client: ClientDescriptor = {
      _brand: "ActionClientDescriptor" as const,
      actionNames: [actionId],
      permissionsKey: "_actionPermissions",
    };

    return { action, loader, client, buildOperation };
  }

  function composeActions<
    TActions extends Record<string, ActionDefinition<any, any, TUser>>,
  >(actions: TActions): ComposedActions<TActions> {
    const actionNames = Object.keys(actions);

    async function composedAction(args: RequestArgs): Promise<unknown> {
      const formData = await args.request.clone().formData();
      const actionName = formData.get("_action") as string;

      if (!actionName || !actions[actionName]) {
        // Try JSON body
        try {
          const body = await args.request.clone().json();
          if (body._action && actions[body._action]) {
            return actions[body._action].action(args);
          }
        } catch {
          // not JSON
        }
        throw new Response(`Unknown action: ${actionName}`, { status: 400 });
      }

      return actions[actionName].action(args);
    }

    function composedLoader<TLoaderData>(
      loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
    ) {
      return async (args: RequestArgs) => {
        const [data, appCtx] = await Promise.all([
          loaderFn(args),
          config.getContext(args),
        ]);

        const permissions: ActionPermissionsMap = {};

        for (const [name, actionDef] of Object.entries(actions)) {
          const op = actionDef.buildOperation(appCtx.db, {} as any, {
            user: appCtx.user,
            request: args.request,
            params: args.params,
          });
          permissions[name] = checkPermissionStatus(appCtx.grants, op.permissions);
        }

        return { ...data, _actionPermissions: permissions };
      };
    }

    const client: ClientDescriptor = {
      _brand: "ActionClientDescriptor" as const,
      actionNames,
      permissionsKey: "_actionPermissions",
    };

    return { action: composedAction, loader: composedLoader, client };
  }

  return { createAction, composeActions };
}
```

**Step 6: Update index.ts exports**

`packages/actions/src/index.ts`:
```typescript
export { createActions } from "./create-actions";
export type {
  ActionContext,
  ActionDefinition,
  ActionPermissionsMap,
  ActionPermissionStatus,
  ActionsConfig,
  ClientDescriptor,
  ComposedActions,
  OperationsFn,
  RequestArgs,
  Serializable,
} from "./types";
```

**Step 7: Run tests, verify, commit**

Run: `pnpm install && pnpm --filter @cfast/actions test`

```bash
git add packages/actions/
git commit -m "feat(actions): core types, createActions factory, createAction, composeActions"
```

---

### Task 2: Comprehensive Server-Side Tests

**Files:**
- Create: `packages/actions/src/__tests__/helpers.ts`
- Modify: `packages/actions/src/__tests__/create-actions.test.ts`

**Context:** Test the full server-side flow: single action execution, composed action dispatch, permission checking in loader, input parsing from formData. Mock the Db and Operation types.

**Step 1: Create test helpers**

`packages/actions/src/__tests__/helpers.ts`:
```typescript
import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";

export function createMockOperation<T>(
  result: T,
  permissions: PermissionDescriptor[] = [],
): Operation<T> {
  return {
    permissions,
    run: async () => result,
  };
}

export function createMockDb(): Db {
  // Return a minimal mock that satisfies the Db interface
  return {
    query: () => ({ findMany: () => createMockOperation([]), findFirst: () => createMockOperation(undefined) }),
    insert: () => ({
      values: () => ({
        permissions: [{ action: "create" as const, table: { _: { name: "test" } } }],
        run: async () => {},
        returning: () => createMockOperation({}),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          permissions: [{ action: "update" as const, table: { _: { name: "test" } } }],
          run: async () => {},
          returning: () => createMockOperation({}),
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        permissions: [{ action: "delete" as const, table: { _: { name: "test" } } }],
        run: async () => {},
        returning: () => createMockOperation({}),
      }),
    }),
    unsafe: () => createMockDb(),
    batch: () => createMockOperation([]),
    cache: { invalidate: async () => {} },
  } as unknown as Db;
}

export function createMockGrants(...actions: Array<{ action: string; table: string }>): Grant[] {
  return actions.map(({ action, table }) => ({
    action: action as Grant["action"],
    subject: { _: { name: table } } as Grant["subject"],
  }));
}

export function createFormDataRequest(data: Record<string, string>, method = "POST"): Request {
  const formData = new URLSearchParams(data);
  return new Request("https://example.com/test", {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
}
```

**Step 2: Write comprehensive tests**

Add to `packages/actions/src/__tests__/create-actions.test.ts`:

Tests to cover:
1. Single action `.action` parses formData and calls operations
2. Single action `.action` passes correct input to operations function
3. Composed `.action` dispatches based on `_action` field
4. Composed `.action` throws 400 for unknown `_action`
5. Single `.loader()` injects `_actionPermissions` into loader data
6. Composed `.loader()` injects permissions for all actions
7. Permission status: permitted=true when grant matches
8. Permission status: permitted=false, invisible=true when no grant matches
9. Permission status: permitted=true for `manage` grant
10. Permission status: permitted=true for `all` subject grant
11. `buildOperation` returns the operation without executing

**Step 3: Run tests, commit**

Run: `pnpm --filter @cfast/actions test`

```bash
git add packages/actions/src/__tests__/
git commit -m "test(actions): comprehensive server-side tests for action dispatch and permissions"
```

---

### Task 3: Client `useActions` Hook

**Files:**
- Create: `packages/actions/src/client/use-actions.ts`
- Create: `packages/actions/src/client/types.ts`
- Create: `packages/actions/src/client.ts`
- Modify: `packages/actions/package.json` (add client export + build entry)
- Create: `packages/actions/src/__tests__/use-actions.test.tsx`

**Context:** `useActions` reads `_actionPermissions` from `useLoaderData()` and returns per-action hooks. Each hook is a function that accepts input and returns `{ permitted, invisible, reason, submit, pending, data, error }`. Uses `useFetcher` from React Router for submission.

**Step 1: Add client export to package.json**

Add to `exports`:
```json
"./client": {
  "import": "./dist/client.js",
  "types": "./dist/client.d.ts"
}
```

Update build script:
```json
"build": "tsup src/index.ts src/client.ts --format esm --dts"
```

**Step 2: Create client types**

`packages/actions/src/client/types.ts`:
```typescript
import type { ActionPermissionStatus, Serializable } from "../types";

export type ActionHook<TInput extends Serializable> = (input: TInput) => {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
  submit: () => void;
  pending: boolean;
  data: unknown | undefined;
  error: unknown | undefined;
};
```

**Step 3: Implement useActions**

`packages/actions/src/client/use-actions.ts`:
```typescript
import { useLoaderData, useFetcher } from "react-router";
import type { ClientDescriptor, ActionPermissionsMap, Serializable } from "../types";

export function useActions<TNames extends string>(
  descriptor: ClientDescriptor,
): Record<TNames, (input: Serializable) => {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
  submit: () => void;
  pending: boolean;
  data: unknown | undefined;
  error: unknown | undefined;
}> {
  const loaderData = useLoaderData() as { _actionPermissions?: ActionPermissionsMap };
  const permissions = loaderData?._actionPermissions ?? {};

  const result: Record<string, unknown> = {};

  for (const name of descriptor.actionNames) {
    result[name] = (input: Serializable) => {
      const fetcher = useFetcher();
      const status = permissions[name] ?? {
        permitted: true,
        invisible: false,
        reason: null,
      };

      return {
        ...status,
        submit: () => {
          const formData = new FormData();
          formData.set("_action", name);
          if (input && typeof input === "object" && !Array.isArray(input)) {
            for (const [key, value] of Object.entries(input)) {
              if (value !== null && value !== undefined) {
                formData.set(key, String(value));
              }
            }
          }
          fetcher.submit(formData, { method: "POST" });
        },
        pending: fetcher.state !== "idle",
        data: fetcher.data,
        error: undefined, // TODO: extract error from fetcher response
      };
    };
  }

  return result as any;
}
```

**Note:** The `useFetcher` call inside the loop is a hooks-in-loop issue. The actual implementation should pre-allocate fetchers. This will be refined during implementation — the implementer should use an approach where each action name gets its own fetcher created at the hook level (e.g., using a Map of fetchers keyed by action name, allocated at component render time). The key constraint is: hooks cannot be called conditionally or in loops.

**Step 4: Create client barrel export**

`packages/actions/src/client.ts`:
```typescript
export { useActions } from "./client/use-actions";
export type { ActionHook } from "./client/types";
```

**Step 5: Write tests (jsdom environment)**

`packages/actions/src/__tests__/use-actions.test.tsx`:
Test that `useActions` reads permission data from loader data and returns correct structures. Mock `useLoaderData` and `useFetcher` from react-router.

**Step 6: Build, test, commit**

Run: `pnpm --filter @cfast/actions build && pnpm --filter @cfast/actions test`

```bash
git add packages/actions/
git commit -m "feat(actions): client useActions hook with permission-aware submission"
```

---

### Task 4: Input Parsing and JSON Support

**Files:**
- Modify: `packages/actions/src/create-actions.ts`
- Create: `packages/actions/src/__tests__/input-parsing.test.ts`

**Context:** Actions need to parse input from both formData (HTML forms) and JSON body (programmatic submit). FormData values are always strings — need to handle type coercion for booleans and numbers from the action's input type.

**Step 1: Add input parsing logic**

Create a `parseInput` function that:
- Tries JSON body first (if Content-Type is application/json)
- Falls back to formData
- Strips the `_action` discriminator field
- Returns a plain object

**Step 2: Write tests for edge cases**

- JSON body with nested objects
- FormData with string values
- Missing required fields
- Extra fields are ignored
- `_action` field is stripped from input

**Step 3: Run tests, commit**

```bash
git commit -m "feat(actions): robust input parsing from formData and JSON"
```

---

### Task 5: Migrate Example App to @cfast/actions

**Files:**
- Create: `examples/team-blog-after/app/actions.server.ts` (factory setup)
- Create: `examples/team-blog-after/app/actions/posts.ts` (post actions)
- Modify: `examples/team-blog-after/app/routes/posts.new.tsx`
- Modify: `examples/team-blog-after/app/routes/posts.$slug.tsx`
- Modify: `examples/team-blog-after/app/routes/posts.$slug.edit.tsx`
- Modify: `examples/team-blog-after/package.json` (add @cfast/actions dep)

**Context:** Replace the manual `_action` switch statements and `compose()` calls in route handlers with `createAction` definitions and `composeActions` dispatchers.

**Step 1: Create app-level actions factory**

`examples/team-blog-after/app/actions.server.ts`:
```typescript
import { createActions } from "@cfast/actions";
import { requireAuthContext } from "~/auth.helpers.server";
import { createCfDb } from "~/db/cfast.server";
import { env } from "~/env";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const e = env.get();
    const ctx = await requireAuthContext(request);
    const db = createCfDb(e.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
});
```

**Step 2: Define post actions**

Extract `deletePost`, `publishPost`, `unpublishPost`, `addComment`, `deleteComment`, `createPost`, `updatePost` from existing route handlers into `app/actions/posts.ts`.

**Step 3: Migrate routes one at a time**

For each route:
1. Import actions from `~/actions/posts`
2. Replace `export async function action(...)` with composed action
3. Wrap loader with `.loader()`
4. Verify the route still works via typecheck

**Step 4: Typecheck, commit**

Run: `pnpm --filter team-blog-after typecheck`

```bash
git commit -m "feat(example): migrate post routes to @cfast/actions"
```

---

### Task 6: Final Review and README Update

**Files:**
- Modify: `packages/actions/README.md`

**Step 1: Update README to reflect actual implemented API**

The README currently shows the aspirational API. Update it to match the actual implementation, including:
- Factory setup with `createActions`
- `createAction` without string names
- `.action`, `.loader()`, `.client` facets
- `useActions` hook usage
- `composeActions` with object keys as discriminators

**Step 2: Run full monorepo tests**

Run: `pnpm test && pnpm typecheck`

**Step 3: Commit**

```bash
git commit -m "docs(actions): update README to match implemented API"
```
