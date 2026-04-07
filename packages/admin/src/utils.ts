/**
 * URL parameter parsing and building for the admin panel.
 *
 * URL structure:
 *   Dashboard:    (none) or ?view=dashboard
 *   Table list:   ?view=posts&page=1&sort=createdAt&dir=desc&search=foo
 *   Record detail:?view=posts&id=abc123
 *   Create:       ?view=posts&mode=create
 *   Edit:         ?view=posts&id=abc123&mode=edit
 *   User list:    ?view=_users&page=1&search=jane
 *   User detail:  ?view=_users&id=user1
 */

export type AdminParams =
  | { kind: "dashboard" }
  | {
      kind: "list";
      table: string;
      page: number;
      sort: string | null;
      direction: "asc" | "desc";
      search: string;
    }
  | { kind: "detail"; table: string; id: string }
  | { kind: "create"; table: string }
  | { kind: "edit"; table: string; id: string }
  | { kind: "user-list"; page: number; search: string }
  | { kind: "user-detail"; id: string };

const USERS_VIEW = "_users";

/**
 * Parse admin URL search params into a discriminated union.
 */
export function parseAdminParams(url: URL): AdminParams {
  const view = url.searchParams.get("view");

  // No view param or explicit "dashboard" => dashboard
  if (!view || view === "dashboard") {
    return { kind: "dashboard" };
  }

  // User management views
  if (view === USERS_VIEW) {
    const id = url.searchParams.get("id");
    if (id) {
      return { kind: "user-detail", id };
    }
    return {
      kind: "user-list",
      page: parsePageParam(url.searchParams.get("page")),
      search: url.searchParams.get("search") ?? "",
    };
  }

  // Table views
  const table = view;
  const id = url.searchParams.get("id");
  const mode = url.searchParams.get("mode");

  if (mode === "create") {
    return { kind: "create", table };
  }

  if (id && mode === "edit") {
    return { kind: "edit", table, id };
  }

  if (id) {
    return { kind: "detail", table, id };
  }

  // Table list view
  const dirParam = url.searchParams.get("dir");
  const direction: "asc" | "desc" =
    dirParam === "asc" ? "asc" : "desc";

  return {
    kind: "list",
    table,
    page: parsePageParam(url.searchParams.get("page")),
    sort: url.searchParams.get("sort"),
    direction,
    search: url.searchParams.get("search") ?? "",
  };
}

/**
 * Build a URL search string from admin params.
 * Returns the search string including the leading "?", or "" for dashboard.
 */
export function buildAdminUrl(params: AdminParams): string {
  const sp = new URLSearchParams();

  switch (params.kind) {
    case "dashboard":
      return "";

    case "list":
      sp.set("view", params.table);
      if (params.page > 1) {
        sp.set("page", String(params.page));
      }
      if (params.sort) {
        sp.set("sort", params.sort);
      }
      if (params.direction !== "desc") {
        sp.set("dir", params.direction);
      }
      if (params.search) {
        sp.set("search", params.search);
      }
      break;

    case "detail":
      sp.set("view", params.table);
      sp.set("id", params.id);
      break;

    case "create":
      sp.set("view", params.table);
      sp.set("mode", "create");
      break;

    case "edit":
      sp.set("view", params.table);
      sp.set("id", params.id);
      sp.set("mode", "edit");
      break;

    case "user-list":
      sp.set("view", USERS_VIEW);
      if (params.page > 1) {
        sp.set("page", String(params.page));
      }
      if (params.search) {
        sp.set("search", params.search);
      }
      break;

    case "user-detail":
      sp.set("view", USERS_VIEW);
      sp.set("id", params.id);
      break;
  }

  const str = sp.toString();
  return str ? `?${str}` : "";
}

/**
 * Parse a page query parameter, defaulting to 1 for invalid values.
 */
function parsePageParam(value: string | null): number {
  if (!value) return 1;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * Discriminated union describing every stable `data-testid` the admin panel
 * applies to its auto-generated UI.
 *
 * The auto-generated admin is meant to be end-to-end tested by downstream
 * apps (Playwright, Cypress, etc.), so each key element gets a predictable
 * selector. Centralizing the format in {@link adminTestId} ensures downstream
 * tests stay in lock-step with the rendered markup.
 */
export type AdminTestIdInput =
  | { kind: "table"; table: string }
  | { kind: "row"; table: string; id: string }
  | { kind: "action"; action: string }
  | { kind: "dashboard-widget"; widget: "count" | "recent"; table: string };

/**
 * Build the `data-testid` value for a given admin UI element.
 *
 * Formats:
 * - `admin-table-{tableName}` — the `<table>` for a table list view.
 * - `admin-row-{tableName}-{id}` — each row in the table list.
 * - `admin-action-{actionName}` — action buttons (create, edit, delete, view, ...).
 * - `admin-dashboard-widget-{type}-{table}` — dashboard widgets
 *   (count cards and recent-item sections).
 *
 * The `table` segment for count widgets is a slug derived from the widget
 * label (e.g. `"Total Users"` → `"total-users"`) because count widgets are
 * identified by their user-provided label, not by the underlying table.
 *
 * @param input - The element identification details.
 * @returns The fully formatted test id string.
 */
export function adminTestId(input: AdminTestIdInput): string {
  switch (input.kind) {
    case "table":
      return `admin-table-${input.table}`;
    case "row":
      return `admin-row-${input.table}-${input.id}`;
    case "action":
      return `admin-action-${input.action}`;
    case "dashboard-widget":
      return `admin-dashboard-widget-${input.widget}-${input.table}`;
  }
}

/**
 * Slugify a human-readable label into a test-id-safe segment.
 *
 * Lowercases, collapses non-alphanumeric runs to single hyphens, and
 * trims leading/trailing hyphens. Used for dashboard count widgets whose
 * labels are user-provided free text (e.g. `"Published Posts"`).
 */
export function slugifyTestIdSegment(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
