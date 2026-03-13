# @cfast/admin

**A complete admin panel generated from your Drizzle schema. With role management and user impersonation.**

`@cfast/admin` gives you a production-ready admin UI derived from your database schema. It's not a generic CRUD generator. It understands your permission system, your auth setup, and your data relationships. Every table gets a list view, detail view, create form, and edit form. Users get a role management panel. Admins get impersonation.

You add one route to your React Router app, and you have an admin panel.

## Why This Exists

Building an admin panel is the same work every time: list pages, detail pages, create/edit forms, user management, role assignment. The structure is always the same — only the schema changes.

`@cfast/admin` automates the schema → configuration step. It reads your Drizzle tables, infers column types, and generates the configuration for `@cfast/ui` components. The actual rendering is delegated entirely to `@cfast/ui` — admin doesn't have its own component library.

This means:
- Apps that don't use the admin panel still get `<ListView>`, `<DetailView>`, and `<DataTable>` from `@cfast/ui`
- Custom admin overrides use the same components as the rest of the app
- Admin stays thin and focused on auto-generation

## Design Goals

- **One route, full admin.** Mount the admin at `/admin` and you're done. Every table, every relationship, every action.
- **Permission-aware by default.** The admin panel uses `@cfast/db` under the hood. Admins see everything. Moderators see what moderators see. The admin UI doesn't bypass your permission system — it uses it.
- **User management built in.** View users, assign roles, revoke roles, impersonate users. Integrated with `@cfast/auth`.
- **Customizable, not locked in.** Override any view, any field, any action. But the default is good enough to ship.
- **UI delegated to `@cfast/ui`.** Admin generates configuration. `@cfast/ui/joy` renders it.

## API

### Minimal Setup

```typescript
// app/routes/admin.tsx
import { createAdmin } from "@cfast/admin";
import type { AdminAuthConfig } from "@cfast/admin";
import * as schema from "~/schema";

// Auth adapter — bridges your app's auth to admin's interface
const auth: AdminAuthConfig = {
  async requireUser(request) {
    // Return { user: AdminUser, grants: unknown[] }
    const session = await getSession(request);
    return { user: session.user, grants: session.grants };
  },
  hasRole: (user, role) => user.roles.includes(role),
  getRoles: (userId) => authInstance.getRoles(userId),
  setRole: (userId, role) => authInstance.setRole(userId, role),
  removeRole: (userId, role) => authInstance.removeRole(userId, role),
  setRoles: (userId, roles) => authInstance.setRoles(userId, roles),
  impersonate: (adminId, targetId, request) => { /* ... */ },
  stopImpersonation: (request) => { /* ... */ },
};

// DB factory — called per-request with grants and user context
function db(grants: unknown[], user: { id: string } | null) {
  return createDb({ d1: env.DB, schema, grants, user });
}

const admin = createAdmin({
  db,
  auth,
  schema,
  requiredRole: "admin", // Role required to access admin (default: "admin")
});

// React Router route:
export const loader = admin.loader;
export const action = admin.action;
export default admin.Component;
```

### Server/Client Splitting

For React Router apps where server code must not leak into client bundles, use the individual factories:

```typescript
// app/admin.server.ts — server only
import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";

const tableMetas = introspectSchema(schema);
export const adminLoader = createAdminLoader(config, tableMetas);
export const adminAction = createAdminAction(config, tableMetas);
```

```typescript
// app/routes/admin.tsx — safe for client bundle
import { createAdminComponent, introspectSchema } from "@cfast/admin";
import { adminLoader, adminAction } from "~/admin.server";

const tableMetas = introspectSchema(schema);
const AdminComponent = createAdminComponent(tableMetas);

export const loader = adminLoader;
export const action = adminAction;
export default AdminComponent;
```

### Table Configuration

Customize how tables appear in the admin:

```typescript
createAdmin({
  db,
  auth,
  schema,
  tables: {
    posts: {
      label: "Blog Posts",
      listColumns: ["title", "author", "published", "createdAt"],
      searchable: ["title", "content"],
      defaultSort: { column: "createdAt", direction: "desc" },
      exclude: false, // Set true to hide a table from admin
      fields: {
        content: { component: RichTextEditor },
      },
    },
    // Tables not listed here use sensible defaults
    // Auth-internal tables (session, account, verification, passkey) are auto-excluded
  },
});
```

### User Management

Built-in views for managing users and roles:

```typescript
createAdmin({
  // ...
  users: {
    // Which roles can be assigned through the admin UI
    // (respects auth.roleGrants for who can assign what)
    assignableRoles: ["user", "editor", "moderator", "admin"],
  },
});
```

The admin automatically provides:
- **User list** with search and filters (via `@cfast/ui`'s `<ListView>`)
- **User detail** page with profile info and activity (via `@cfast/ui`'s `<DetailView>`)
- **Role assignment** panel (respects `roleGrants` from `@cfast/auth`)
- **Impersonation** button (for authorized roles) - starts an impersonation session via `@cfast/auth`

### Impersonation UX

When an admin impersonates a user:

1. The admin panel shows an impersonation banner with a "Stop Impersonation" button
2. The rest of the app behaves as that user (same session, same permissions)
3. Impersonation start/stop is handled by the `auth.impersonate` and `auth.stopImpersonation` callbacks you provide
4. Audit logging is the responsibility of your auth adapter (see the example in Minimal Setup)

### Custom Actions

Add table-level or row-level actions:

```typescript
createAdmin({
  // ...
  tables: {
    posts: {
      actions: {
        row: [
          {
            label: "Publish",
            action: async (id: string, formData: FormData) => {
              // Custom logic — called with the record ID and form data
            },
            confirm: "Are you sure you want to publish?", // Optional confirmation dialog
            variant: "default", // "default" | "danger" — controls button styling
          },
        ],
        table: [
          {
            label: "Export CSV",
            handler: async (selectedIds: string[]) => {
              // Called with an array of selected record IDs
            },
          },
        ],
      },
    },
  },
});
```

### Dashboard

The admin index page shows an overview dashboard:

```typescript
createAdmin({
  // ...
  dashboard: {
    widgets: [
      { type: "count", table: "users", label: "Total Users" },
      { type: "count", table: "posts", label: "Published Posts", where: { published: true } },
      { type: "recent", table: "posts", limit: 5, label: "Recent Posts" },
    ],
  },
});
```

## How It Works

`@cfast/admin` is a thin layer that does two things:

1. **Schema introspection** — reads your Drizzle schema to generate configuration: which columns to show, which fields to use in forms, which relations to resolve, which actions to offer
2. **Configuration → UI components** — passes that configuration to `@cfast/ui` components for rendering

The rendering stack:

| Admin feature | Rendered with |
|---|---|
| Create/edit forms | `@cfast/forms`' `<AutoForm>` |
| User role display | `@cfast/ui`'s `<RoleBadge>` |
| User avatars | `@cfast/ui`'s `<AvatarWithInitials>` |
| Confirm dialogs | `@cfast/ui`'s `useConfirm` |
| List, detail, dashboard views | Built-in admin components (MUI Joy) |
| Navigation sidebar | Built-in admin components (MUI Joy) |

## Integration

- **`@cfast/ui`** — All rendering. Admin generates configuration, UI renders pixels.
- **`@cfast/db`** — All data access. Every CRUD operation goes through permission-checked Operations via `.run()`.
- **`@cfast/auth`** — User management, role assignment, and impersonation.
- **`@cfast/forms`** — Create/edit forms via `<AutoForm>`.
- **`@cfast/actions`** — Custom row and table actions, permission-aware.
- **`@cfast/permissions`** — The admin respects the permission system. An editor role in the admin sees what editors see.
- **`@cfast/pagination`** — List views paginate via `@cfast/pagination` hooks.

The admin is not a separate app. It's a React Router route that uses the same database, same permissions, same auth as the rest of your application.
