# cfast

## CI & PR Guidelines

- When working on a PR, always fix **all** CI failures — including ones unrelated to the PR's primary changes. A green CI is required before merging.

## React Router Server/Client Boundary

Route files are split by React Router into server and client bundles. `.server` imports are **only safe** when they're exclusively referenced in server exports (`loader`, `action`).

**Never** create a module-level variable from a `.server` import and then use it in both a server export and the component:

```ts
// BAD — `composed` bridges server import into client code
import { composeActions } from "~/actions.server";
const composed = composeActions({ ... });
export const action = composed.action;   // server
// ...
useActions(composed.client);              // client — breaks build
```

Instead, inline the `.server` usage in the server export and use `clientDescriptor()` from `@cfast/actions/client` for client code:

```ts
// GOOD — .server import only referenced in `action` export
import { composeActions } from "~/actions.server";
import { clientDescriptor } from "@cfast/actions/client";

const client = clientDescriptor(["create", "delete"]);
export const action = composeActions({ create, delete }).action;
// ...
useActions(client);
```

The same rule applies to any `.server` module — only reference it inside `loader`/`action` exports, never at module scope if the result flows into client code.
