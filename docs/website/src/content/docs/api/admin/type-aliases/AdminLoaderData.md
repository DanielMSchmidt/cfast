---
editUrl: false
next: false
prev: false
title: "AdminLoaderData"
---

> **AdminLoaderData** = \{ `recentItems`: [`RecentItem`](/api/admin/type-aliases/recentitem/)[]; `stats`: [`DashboardStat`](/api/admin/type-aliases/dashboardstat/)[]; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"dashboard"`; \} \| \{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `items`: `Record`\<`string`, `unknown`\>[]; `page`: `number`; `search`: `string`; `searchable`: `string`[]; `sort`: \{ `column`: `string`; `direction`: `"asc"` \| `"desc"`; \}; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `total`: `number`; `totalPages`: `number`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"list"`; \} \| \{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `item`: `Record`\<`string`, `unknown`\>; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"detail"`; \} \| \{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"create"`; \} \| \{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `item`: `Record`\<`string`, `unknown`\>; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"edit"`; \} \| \{ `assignableRoles`: `string`[]; `items`: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`[]; `page`: `number`; `search`: `string`; `tables`: `object`[]; `total`: `number`; `totalPages`: `number`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"users"`; \} \| \{ `assignableRoles`: `string`[]; `tables`: `object`[]; `targetUser`: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"user-detail"`; \} \| \{ `message`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"error"`; \}

Defined in: [packages/admin/src/types.ts:414](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L414)

Discriminated union of all data shapes returned by the admin loader.

The `view` field determines which admin view to render:
- `"dashboard"` -- the admin index page with stats and recent items
- `"list"` -- paginated table list with search and sorting
- `"detail"` -- single record detail view
- `"create"` -- new record form
- `"edit"` -- edit existing record form
- `"users"` -- user management list
- `"user-detail"` -- single user detail with role management
- `"error"` -- error message display

Every variant includes the current [AdminUser](/api/admin/type-aliases/adminuser/) and the sidebar table list.

## Type Declaration

\{ `recentItems`: [`RecentItem`](/api/admin/type-aliases/recentitem/)[]; `stats`: [`DashboardStat`](/api/admin/type-aliases/dashboardstat/)[]; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"dashboard"`; \}

### recentItems

> **recentItems**: [`RecentItem`](/api/admin/type-aliases/recentitem/)[]

Recent item sections to display on the dashboard.

### stats

> **stats**: [`DashboardStat`](/api/admin/type-aliases/dashboardstat/)[]

Stat cards to display on the dashboard.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"dashboard"`

Dashboard view identifier.

\{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `items`: `Record`\<`string`, `unknown`\>[]; `page`: `number`; `search`: `string`; `searchable`: `string`[]; `sort`: \{ `column`: `string`; `direction`: `"asc"` \| `"desc"`; \}; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `total`: `number`; `totalPages`: `number`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"list"`; \}

### columns

> **columns**: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]

Column metadata for rendering the list.

### items

> **items**: `Record`\<`string`, `unknown`\>[]

The page of records to display.

### page

> **page**: `number`

Current page number (1-based).

### search

> **search**: `string`

Current search query string.

### searchable

> **searchable**: `string`[]

Column names that support search.

### sort

> **sort**: `object`

Current sort column and direction.

#### sort.column

> **column**: `string`

#### sort.direction

> **direction**: `"asc"` \| `"desc"`

### tableLabel

> **tableLabel**: `string`

Human-readable table label.

### tableName

> **tableName**: `string`

The Drizzle table name being listed.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### total

> **total**: `number`

Total number of records matching the current search/filter.

### totalPages

> **totalPages**: `number`

Total number of pages.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"list"`

Table list view identifier.

\{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `item`: `Record`\<`string`, `unknown`\>; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"detail"`; \}

### columns

> **columns**: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]

Column metadata for rendering the detail fields.

### item

> **item**: `Record`\<`string`, `unknown`\>

The record data as a key-value object.

### tableLabel

> **tableLabel**: `string`

Human-readable table label.

### tableName

> **tableName**: `string`

The Drizzle table name of the record.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"detail"`

Record detail view identifier.

\{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"create"`; \}

### columns

> **columns**: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]

Column metadata for rendering form fields.

### tableLabel

> **tableLabel**: `string`

Human-readable table label.

### tableName

> **tableName**: `string`

The Drizzle table name for the new record.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"create"`

Create form view identifier.

\{ `columns`: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]; `item`: `Record`\<`string`, `unknown`\>; `tableLabel`: `string`; `tableName`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"edit"`; \}

### columns

> **columns**: [`AdminColumnConfig`](/api/admin/type-aliases/admincolumnconfig/)[]

Column metadata for rendering form fields.

### item

> **item**: `Record`\<`string`, `unknown`\>

The existing record data to pre-fill the form.

### tableLabel

> **tableLabel**: `string`

Human-readable table label.

### tableName

> **tableName**: `string`

The Drizzle table name of the record being edited.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"edit"`

Edit form view identifier.

\{ `assignableRoles`: `string`[]; `items`: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`[]; `page`: `number`; `search`: `string`; `tables`: `object`[]; `total`: `number`; `totalPages`: `number`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"users"`; \}

### assignableRoles

> **assignableRoles**: `string`[]

Roles that can be assigned via the admin UI.

### items

> **items**: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`[]

The page of user records enriched with role data.

### page

> **page**: `number`

Current page number (1-based).

### search

> **search**: `string`

Current search query string.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### total

> **total**: `number`

Total number of users matching the search.

### totalPages

> **totalPages**: `number`

Total number of pages.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"users"`

User list view identifier.

\{ `assignableRoles`: `string`[]; `tables`: `object`[]; `targetUser`: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"user-detail"`; \}

### assignableRoles

> **assignableRoles**: `string`[]

Roles that can be assigned via the admin UI.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### targetUser

> **targetUser**: [`AdminUser`](/api/admin/type-aliases/adminuser/) & `object`

The user being viewed, enriched with role and creation date data.

#### Type Declaration

##### createdAt?

> `optional` **createdAt**: `string`

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"user-detail"`

User detail view identifier.

\{ `message`: `string`; `tables`: `object`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); `view`: `"error"`; \}

### message

> **message**: `string`

The error message to display.

### tables

> **tables**: `object`[]

Table list for the sidebar navigation.

### user

> **user**: [`AdminUser`](/api/admin/type-aliases/adminuser/)

The authenticated admin user.

### view

> **view**: `"error"`

Error view identifier.
