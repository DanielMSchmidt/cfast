# @cfast/admin — Design

## Decisions

- **Client-side routing** within a single React Router route (no nested routes)
- **Standalone** — no `@cfast/core` dependency; plugin wrapper added later
- **Search-param driven loader** — URL params like `?view=posts&page=2` trigger revalidation
- **Full README scope** — dashboard, table CRUD, user management, impersonation, custom actions
- **Configuration object pattern** — `createAdmin()` returns `{ loader, action, Component }`
- **Build AutoForm** in `@cfast/forms` as a prerequisite

## Public API

```typescript
function createAdmin(config: AdminConfig): {
  loader: LoaderFunction;
  action: ActionFunction;
  Component: React.ComponentType;
};

type AdminConfig = {
  db: CreateDbFn;                  // (request, context) => Db
  auth: AdminAuthConfig;           // auth function interface
  schema: Record<string, Table>;   // Drizzle schema (import * as schema)
  tables?: Record<string, TableOverrides>;
  users?: UserManagementConfig;
  dashboard?: DashboardConfig;
  basePath?: string;               // defaults to "/admin"
  requiredRole?: string;           // defaults to "admin"
};

type AdminAuthConfig = {
  requireUser: (request: Request) => Promise<AuthUser>;
  hasRole: (user: AuthUser, role: string) => boolean;
  setRole: (userId: string, role: string) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  impersonate: (adminId: string, targetId: string) => Promise<Response>;
  stopImpersonation: (request: Request) => Promise<Response>;
};

type TableOverrides = {
  label?: string;
  listColumns?: string[];
  searchable?: string[];
  defaultSort?: { column: string; direction: "asc" | "desc" };
  fields?: Record<string, FieldOverride>;
  actions?: { row?: RowAction[]; table?: TableAction[] };
  exclude?: boolean;
};

type UserManagementConfig = {
  displayFields?: string[];
  assignableRoles?: string[];
};

type DashboardConfig = {
  widgets?: DashboardWidget[];
};

type DashboardWidget =
  | { type: "count"; table: string; label: string; where?: Record<string, unknown> }
  | { type: "recent"; table: string; label: string; limit?: number };

type RowAction = {
  label: string;
  action: (id: string, formData: FormData) => Promise<unknown>;
  confirm?: string;
  variant?: "danger" | "default";
};

type TableAction = {
  label: string;
  handler: (selectedIds: string[]) => Promise<unknown>;
};

type FieldOverride = {
  component?: React.ComponentType;
  label?: string;
  hidden?: boolean;
  readOnly?: boolean;
};
```

## Schema Introspection

`introspectSchema(schema)` takes the raw Drizzle schema and produces:

```typescript
type AdminTableConfig = {
  name: string;
  label: string;
  columns: AdminColumnConfig[];
  primaryKey: string;
  relations: AdminRelationConfig[];
};

type AdminColumnConfig = {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "enum" | "json" | "relation";
  enumValues?: string[];
  required: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  referencesTable?: string;
  referencesColumn?: string;
};
```

Reuses `@cfast/forms` `introspectTable()` for column type inference. Extends it with relation detection via foreign key references. User overrides from `tables` config merge on top of introspected defaults.

Auto-excluded tables: `session`, `account`, `verification`, `passkey`.

## URL Structure (Search Params)

| View | Search Params |
|---|---|
| Dashboard | `(none)` or `?view=dashboard` |
| Table list | `?view=posts&page=1&sort=createdAt&dir=desc&search=foo` |
| Record detail | `?view=posts&id=abc123` |
| Create record | `?view=posts&mode=create` |
| Edit record | `?view=posts&id=abc123&mode=edit` |
| User list | `?view=_users&page=1&search=jane` |
| User detail | `?view=_users&id=abc123` |

`_users` prefixed with underscore to avoid collision with a user-defined "users" table.

## Loader

Parses search params and returns a discriminated union:

```typescript
type LoaderData =
  | { view: "dashboard"; stats: DashboardStats[]; recentItems: RecentItems[] }
  | { view: "list"; table: string; items: unknown[]; total: number; page: number; columns: AdminColumnConfig[]; permissions: ActionPermissions }
  | { view: "detail"; table: string; item: Record<string, unknown>; columns: AdminColumnConfig[]; permissions: ActionPermissions }
  | { view: "create"; table: string; columns: AdminColumnConfig[]; permissions: ActionPermissions }
  | { view: "edit"; table: string; item: Record<string, unknown>; columns: AdminColumnConfig[]; permissions: ActionPermissions };
```

- Auth guard first — `auth.requireUser()` + role check
- All queries through `@cfast/db` (permission-aware)
- Relations resolved via joins for display values
- Permissions returned so UI can show/hide actions

## Action

Mutations via `_action` discriminator:

| `_action` | Handler |
|---|---|
| `create` | `db.insert(table).values(formData)` |
| `update` | `db.update(table).set(formData).where(eq(pk, id))` |
| `delete` | `db.delete(table).where(eq(pk, id))` |
| `setRole` | `auth.setRole(userId, role)` |
| `removeRole` | `auth.removeRole(userId, role)` |
| `impersonate` | `auth.impersonate(adminId, targetId)` |
| `stopImpersonation` | `auth.stopImpersonation(request)` |
| Custom | Dispatched to user-provided action handlers |

PRG pattern: action returns redirect to same URL after mutation.

## Component Tree

```
AdminRoot
├── AppShell
│   ├── Sidebar (Dashboard + table links + Users link)
│   ├── ImpersonationBanner (if impersonating)
│   └── Main content (switches on loaderData.view)
│       ├── DashboardView (stat cards + recent items)
│       ├── TableListView (PageContainer + FilterBar + DataTable + pagination)
│       ├── TableDetailView (PageContainer + DetailView + action toolbar)
│       ├── TableCreateView (PageContainer + AutoForm mode="create")
│       ├── TableEditView (PageContainer + AutoForm mode="edit")
│       ├── UserListView (search + DataTable + impersonate buttons)
│       └── UserDetailView (profile + role management + impersonate)
```

All internal navigation uses search param links triggering revalidation.

## AutoForm (new in @cfast/forms)

Prerequisite component built in `@cfast/forms`:

```typescript
type AutoFormProps = {
  table: Table;
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  exclude?: string[];
  fields?: Record<string, FieldOverride>;
  onSubmit?: string;
  additionalFields?: Record<string, unknown>;
};
```

Behavior:
1. `introspectTable(table)` → field definitions
2. Filter out PKs (create mode), excluded columns, auto-timestamp columns
3. `createResolver(fields)` → client-side validation
4. Render typed fields from `@cfast/ui` per column type
5. Edit mode: pre-fill from `data`, PK read-only
6. Submit as React Router `<Form method="post">`

Joy UI implementation at `@cfast/forms/joy` entrypoint.

## Error Handling

| Scenario | Behavior |
|---|---|
| Not authenticated | Redirect to login |
| Lacks required role | Redirect to `/` |
| Unknown `?view=` table | Error message in main area |
| Record not found | "Not found" with back link |
| Validation failure | Field-level errors in AutoForm |
| FK constraint on delete | Error toast |
| Permission denied | ActionButton hidden; ForbiddenError caught in action |
| Impersonate self | Rejected with error |

## File Structure

```
packages/admin/src/
├── index.ts              # createAdmin() public API
├── types.ts              # AdminConfig, TableOverrides, etc.
├── introspect.ts         # introspectSchema() — Drizzle → AdminTableConfig[]
├── loader.ts             # Loader factory
├── action.ts             # Action factory
├── components/
│   ├── admin-root.tsx    # AppShell + view switch
│   ├── dashboard.tsx     # Dashboard view
│   ├── table-list.tsx    # List view
│   ├── table-detail.tsx  # Detail view
│   ├── table-form.tsx    # Create/edit (wraps AutoForm)
│   ├── user-list.tsx     # User list
│   ├── user-detail.tsx   # User detail + roles
│   └── sidebar.tsx       # Navigation sidebar
└── utils.ts              # Param parsing, label generation

packages/forms/src/
├── ... (existing)
├── auto-form.ts          # Headless AutoForm
└── joy/
    └── auto-form.tsx     # Joy UI AutoForm
```

## Dependencies

`@cfast/admin` depends on: `@cfast/db`, `@cfast/auth`, `@cfast/permissions`, `@cfast/actions`, `@cfast/ui`, `@cfast/forms`, `@cfast/pagination`.

All rendering delegated to `@cfast/ui`. All data access through `@cfast/db`. All auth through function interface. Admin is a thin orchestration layer.
