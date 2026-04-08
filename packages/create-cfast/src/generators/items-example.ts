import type { Config } from "../types";

/**
 * Generates a worked `composeActions` example for the scaffolded app.
 *
 * Ships two files that are only emitted when `db` AND `ui` are both
 * selected (so `@cfast/actions` and a concrete table exist):
 *
 *  - `app/items.server.ts` — defines `createItem` and `deleteItem` actions
 *    through the scoped `createAction` factory from `actions.server.ts`.
 *  - `app/routes/items.tsx` — a route that calls `composeActions({...})`,
 *    exports `composed.action` as the React Router `action`, uses the
 *    matching `composed.loader(...)` wrapper to surface per-action
 *    permission status, and renders `<ActionForm intent="...">` buttons
 *    from `@cfast/actions/client`.
 *
 * Before this example existed (see #153) demo apps rolled their own
 * `request.formData()` handling — which silently bypassed permission
 * checks, lost the `intent` hidden field, and left users reinventing a
 * pattern that already ships in the framework. Keep this example in
 * sync with the conventions in `CLAUDE.md` whenever they change.
 */
export function shouldEmitItemsExample(config: Config): boolean {
  // Emit only when db + ui + auth are all enabled. The route uses
  // `requireUser(request)` from `app/auth.helpers.server.ts` so it can
  // hand the authenticated user's id to the action layer; ui without
  // auth has no helpers file to import. db + auth combos always pull
  // in ui via `resolveFeatureDeps`, so any feature combo that enables
  // auth will get this example.
  return config.features.db && config.features.ui && config.features.auth;
}

export function generateItemsServer(_config: Config): string {
  return `import { eq } from "drizzle-orm";
import { createAction } from "~/actions.server";
import { items } from "~/db/schema";

/**
 * Worked composeActions example — see \`app/routes/items.tsx\`.
 *
 * Each action returns an \`Operation\` via a \`@cfast/db\` builder so
 * permissions are enforced at \`.run()\` time by the DB layer. Never add
 * manual \`can()\` / \`hasRole()\` checks here — the grants declared in
 * \`app/permissions.ts\` are the single source of truth.
 */

export const createItem = createAction<{ title: string }, { id: string }>(
  (db, input) => {
    const id = crypto.randomUUID();
    return db
      .insert(items)
      .values({ id, title: input.title, content: "" })
      .returning();
  },
);

export const deleteItem = createAction<{ id: string }, void>((db, input) =>
  db.delete(items).where(eq(items.id, input.id)),
);
`;
}

export function generateItemsRoute(_config: Config): string {
  return `import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { ActionForm, clientDescriptor, useActions } from "@cfast/actions/client";
import { createItem, deleteItem } from "~/items.server";
import { composeActions } from "~/actions.server";
import { requireAuthContext } from "~/auth.helpers.server";
import { createDb } from "@cfast/db";
import * as schema from "~/db/schema";
import { items } from "~/db/schema";
import { env } from "~/env";

/**
 * Worked example of the canonical \`composeActions\` pattern.
 *
 * Key conventions (see \`CLAUDE.md\`):
 *
 * 1. Define each action with \`createAction\` from \`~/actions.server\` so
 *    the shared \`getContext\` resolves db, user, and grants identically
 *    across every route.
 * 2. Combine them with \`composeActions({...})\`. Export \`composed.action\`
 *    as this route's React Router \`action\` — never hand-write
 *    \`export async function action({ request }) { ... }\`.
 * 3. Wrap the loader with \`composed.loader(...)\` so \`_actionPermissions\`
 *    is serialised alongside your loader data and the client hook can
 *    disable buttons for actions the user can't run.
 * 4. Build the client descriptor via \`clientDescriptor([...])\` (a plain
 *    string-array) instead of importing \`composed.client\` — importing
 *    anything from a \`.server\` module into client code breaks the React
 *    Router server/client split (see CLAUDE.md's "React Router
 *    Server/Client Boundary" section).
 * 5. Use \`<ActionForm intent="...">\` so the \`intent\` hidden field is
 *    injected automatically. Do NOT add manual
 *    \`<input type="hidden" name="intent">\` — that is the anti-pattern
 *    this component exists to replace.
 */

// --- Server side ---
//
// Note: \`composeActions({...})\` is invoked inline inside each server export
// rather than assigned to a module-level variable. A shared \`const composed\`
// at module scope would technically work (both \`loader\` and \`action\` are
// server-only) but it risks accidentally referencing \`composed.client\`
// from the component later — which drags the entire \`.server\` bundle into
// the browser. See the "React Router Server/Client Boundary" section in
// \`CLAUDE.md\`.

export const loader = composeActions({ createItem, deleteItem }).loader(
  async ({ request }: LoaderFunctionArgs) => {
    // \`requireAuthContext\` redirects unauthenticated requests to /login
    // BEFORE we touch the DB, so the loader never reaches the query with
    // anonymous grants and never trips a ForbiddenError as a 500.
    const auth = await requireAuthContext(request);
    const e = env.get();
    const db = createDb({
      d1: e.DB,
      schema: schema as unknown as Record<string, object>,
      grants: auth.grants,
      user: { id: auth.user.id },
      cache: false,
    });
    const allItems = await db
      .query(items)
      .findMany({ orderBy: (cols, { desc }) => desc(cols.createdAt) })
      .run({});
    return { items: allItems };
  },
);

export const action = composeActions({ createItem, deleteItem }).action;

// --- Client side ---

// Never import \`composed.client\` from a \`.server\` module into client
// code — it would pull the entire server bundle into the browser. Build
// a pure client descriptor from the action name list instead.
const client = clientDescriptor(["createItem", "deleteItem"]);

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function ItemsRoute() {
  const data = useLoaderData<LoaderData>();
  const actions = useActions(client);

  return (
    <main style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Items</h1>
      <p>
        This page is a worked example of the <code>composeActions</code>{" "}
        pattern from <code>@cfast/actions</code>. Both the server handler
        and the client buttons share the same action definitions.
      </p>

      <ActionForm intent="createItem">
        <label>
          Title{" "}
          <input name="title" required placeholder="Write a title..." />
        </label>
        <button type="submit" disabled={!actions.createItem.canRun}>
          Create item
        </button>
        {!actions.createItem.canRun ? (
          <small style={{ color: "#999", marginLeft: "0.5rem" }}>
            (your role cannot create items)
          </small>
        ) : null}
      </ActionForm>

      <ul style={{ marginTop: "1.5rem" }}>
        {data.items.map((item) => (
          <li key={item.id}>
            {item.title}
            <ActionForm intent="deleteItem" style={{ display: "inline" }}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                disabled={!actions.deleteItem.canRun}
                style={{ marginLeft: "0.5rem" }}
              >
                Delete
              </button>
            </ActionForm>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;
}
