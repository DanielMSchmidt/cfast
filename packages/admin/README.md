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

## Planned API

### Minimal Setup

```typescript
// app/routes/admin.tsx (or wherever you mount it)
import { createAdmin } from "@cfast/admin";
import { db } from "~/db";
import { auth } from "~/auth";
import * as schema from "~/schema";

export const admin = createAdmin({
  db,
  auth,
  schema,
  // That's it. Every table in your schema gets a full CRUD UI.
});

// React Router route:
export const loader = admin.loader;
export const action = admin.action;
export default admin.Component;
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
      fields: {
        content: { component: RichTextEditor },
      },
    },
    // Tables not listed here use sensible defaults
  },
});
```

### User Management

Built-in views for managing users and roles:

```typescript
createAdmin({
  // ...
  users: {
    // Control which user fields are visible/editable in admin
    displayFields: ["email", "name", "createdAt", "lastLogin"],
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

1. The admin panel shows a banner via `@cfast/ui`'s `<ImpersonationBanner>`
2. The rest of the app behaves as that user (same session, same permissions)
3. A floating button lets the admin end impersonation at any time
4. All impersonation events are logged to an audit table

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
            action: publishPostAction, // from @cfast/actions
            // Automatically hidden if the admin can't perform this action
          },
        ],
        table: [
          {
            label: "Export CSV",
            handler: async (selectedRows) => { /* ... */ },
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

| Admin generates config for... | Which renders via... |
|---|---|
| Table list pages | `@cfast/ui`'s `<ListView>` |
| Record detail pages | `@cfast/ui`'s `<DetailView>` |
| Create/edit forms | `@cfast/forms`' `<AutoForm>` |
| Navigation sidebar | `@cfast/ui`'s `<AppShell>` |
| Data tables | `@cfast/ui`'s `<DataTable>` |
| Filters | `@cfast/ui`'s `<FilterBar>` |
| Action buttons | `@cfast/ui`'s `<ActionButton>` |
| Bulk actions | `@cfast/ui`'s `<BulkActionBar>` |
| User role display | `@cfast/ui`'s `<RoleBadge>` |
| Impersonation UI | `@cfast/ui`'s `<ImpersonationBanner>` |

Admin does **not** contain its own component library. If you want to customize how a list page looks, you override it with `@cfast/ui` components — the same components you'd use anywhere else in your app.

## Integration

- **`@cfast/ui`** — All rendering. Admin generates configuration, UI renders pixels.
- **`@cfast/db`** — All data access. Every CRUD operation goes through permission-checked Operations via `.run()`.
- **`@cfast/auth`** — User management, role assignment, and impersonation.
- **`@cfast/forms`** — Create/edit forms via `<AutoForm>`.
- **`@cfast/actions`** — Custom row and table actions, permission-aware.
- **`@cfast/permissions`** — The admin respects the permission system. An editor role in the admin sees what editors see.
- **`@cfast/pagination`** — List views paginate via `@cfast/pagination` hooks.

The admin is not a separate app. It's a React Router route that uses the same database, same permissions, same auth as the rest of your application.
