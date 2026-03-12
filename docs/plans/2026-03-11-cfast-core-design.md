# @cfast/core Design — App Composition Layer

**Date:** 2026-03-11
**Status:** Approved

## Problem

Every route in a cfast app repeats the same 3-line boilerplate to wire env → auth → db. On the client side, there's no unified provider tree. The packages are independently excellent but the user is the integration layer.

## Decision

Add `@cfast/core` as an **optional convenience** package (approach B). Apps can still use individual packages directly, but `createApp()` wires them together for the common case.

## Architecture: Plugin System

Core uses a plugin registration pattern (`createApp().use()`) rather than a declarative config object. This keeps core decoupled from individual packages — each package ships its own plugin alongside its standalone API.

### Plugin Contract

```typescript
definePlugin<TRequires>(config: {
  name: string;
  setup(ctx: { request, env } & TRequires): TProvides | Promise<TProvides>;
  Provider?: React.ComponentType<{ children: ReactNode }>;
  client?: TClientProvides;
})
```

- **Dependencies** declared via generic type parameter, using type tokens exported by upstream packages
- **Namespaced context** — each plugin's `setup()` return is nested under its `name` key, preventing collisions
- **Registration order** — plugins run in `.use()` order, validated at startup

### Server API

- `app.init(rawEnv)` — validates env in Workers entry
- `app.env()` — typed env access
- `app.context(request, context)` — builds per-request context from plugin chain
- `app.loader(fn)` / `app.action(fn)` — optional convenience wrappers

### Client API

- `<app.Provider>` — composes all plugin providers
- `useApp()` — typed access to all plugins' client exports

### Key Decisions

1. **Optional, not required** — packages stay first-class standalone
2. **Plugins, not config** — decouples core from package release cycles
3. **Namespaced, not flat** — prevents plugin value collisions
4. **Ordered, not sorted** — explicit registration order, validated at startup
5. **Generic requires, not `as` cast** — clean type dependency declaration

## Dependencies

Core depends on: `@cfast/env`, `@cfast/permissions` (the two leaves).
All other packages are peer/optional via their plugin exports.

## Full Spec

See `packages/core/README.md` for complete API reference and plugin authoring guide.
