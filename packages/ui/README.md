# @cfast/ui

**Permission-aware React components. The button knows what the user can do.**

`@cfast/ui` connects the permission system to the component layer. Its headline feature: a button that wraps an action. The action declares what permissions it needs (via `@cfast/actions` + `@cfast/permissions`). The button automatically hides itself if the user lacks all permissions, disables itself if permissions are partially missing, and renders normally if everything checks out. The developer writes zero permission-checking UI code.

## Design Goals

- **Permissions in, UI out.** Components consume actions from `@cfast/actions`. Actions carry their permission requirements via operations. The component reads `permitted` and adapts — no manual checking in JSX.
- **UI library plugins.** The core is headless. Ship with a MUI Joy UI plugin. Add others without touching the core.
- **Minimal surface area.** This package does one thing: permission-aware component wrappers. Forms are in `@cfast/forms`. Pagination is in `@cfast/pagination`. Admin is in `@cfast/admin`.

## Planned API

### Permission-Aware Action Button

```typescript
import { ActionButton } from "@cfast/ui/joy";
import { publishPostAction } from "./actions";

function PostToolbar({ postId }) {
  return (
    <ActionButton
      action={publishPostAction}
      input={{ postId }}
      // That's it. The button:
      // - Checks if the user can perform all of publishPostAction's required permissions
      // - Hides itself if the user has no relation to this action at all
      // - Disables itself with a tooltip if permissions are partial
      // - Submits the action when clicked
    >
      Publish
    </ActionButton>
  );
}
```

The behavior is configurable:

```typescript
<ActionButton
  action={deletePostAction}
  input={{ postId }}
  whenForbidden="hide"     // "hide" | "disable" | "show" (default: "disable")
  confirmation="Are you sure?"
/>
```

### Permission Gate

Conditionally render content based on an action's permissions:

```typescript
import { PermissionGate } from "@cfast/ui";
import { editPost, manageSettings } from "~/actions";

<PermissionGate action={editPost} input={{ postId }}>
  <EditButton />
</PermissionGate>

<PermissionGate action={manageSettings} fallback={<UpgradePrompt />}>
  <AdminPanel />
</PermissionGate>
```

`PermissionGate` uses `useAction()` internally — it reads the server-precomputed `permitted` boolean. No permission descriptors are evaluated on the client.

### UI Library Plugins

The core is headless logic. Rendering is delegated to plugins:

```typescript
// Joy UI (ships with cfast)
import { ActionButton } from "@cfast/ui/joy";

// Future plugins:
// import { ActionButton } from "@cfast/ui/shadcn";
```

Creating a plugin:

```typescript
import { createUIPlugin } from "@cfast/ui";

export const myPlugin = createUIPlugin({
  components: {
    button: MyButton,
    tooltip: MyTooltip,
    confirmDialog: MyConfirmDialog,
  },
});
```

## Architecture

```
@cfast/ui (headless core)
├── Action introspection (reads permitted/invisible from @cfast/actions)
├── PermissionGate component
└── Plugin API (createUIPlugin)

@cfast/ui/joy (MUI Joy UI plugin)
├── ActionButton with Joy styling
├── Tooltip for disabled state reasons
├── Confirm dialog
└── Loading states
```
