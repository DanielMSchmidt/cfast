# @cfast/admin

**A complete admin panel generated from your Drizzle schema. With role management and user impersonation.**

`@cfast/admin` gives you a production-ready admin UI derived from your database schema. It's not a generic CRUD generator. It understands your permission system, your auth setup, and your data relationships. Every table gets a list view, detail view, create form, and edit form. Users get a role management panel. Admins get impersonation.

You add one route to your React Router app, and you have an admin panel.

## Design Goals

- **One route, full admin.** Mount the admin at `/admin` and you're done. Every table, every relationship, every action.
- **Permission-aware by default.** The admin panel uses `@cfast/db` under the hood. Admins see everything. Moderators see what moderators see. The admin UI doesn't bypass your permission system. It uses it.
- **User management built in.** View users, assign roles, revoke roles, impersonate users. Integrated with `@cfast/auth`.
- **Customizable, not locked in.** Override any view, any field, any action. But the default is good enough to ship.

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
- **User list** with search and filters
- **User detail** page with profile info and activity
- **Role assignment** panel (respects `roleGrants` from `@cfast/auth`)
- **Impersonation** button (for authorized roles) - starts an impersonation session via `@cfast/auth`

### Impersonation UX

When an admin impersonates a user:

1. The admin panel shows a banner: "Viewing as user@example.com"
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
            action: publishPostAction, // from @cfast/permissions
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

`@cfast/admin` composes the other cfast packages:

- **Schema introspection:** Reads your Drizzle schema to generate list views, forms, and navigation
- **Forms:** Uses `@cfast/ui` AutoForm for create/edit views
- **Permissions:** Uses `@cfast/db` guarded queries for all data access
- **Auth:** Uses `@cfast/auth` for user management, role assignment, and impersonation
- **Routing:** Renders inside a React Router route, uses nested routing for table/detail views

The admin is not a separate app. It's a React Router route that uses the same database, same permissions, same auth as the rest of your application.
