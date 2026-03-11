# @cfast/ui Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build permission-aware React components that auto-hide/disable based on action permissions, with a pluggable UI library system.

**Architecture:** Headless core provides `useActionStatus()` hook, `PermissionGate` component, and `createUIPlugin()` factory. Joy UI plugin passes MUI Joy primitives into `createUIPlugin()` to produce `ActionButton`. All permission data comes from `useActions()` in `@cfast/actions/client`.

**Tech Stack:** React 19, TypeScript, @cfast/actions/client, @mui/joy (peer dep), vitest, tsup

---

### Task 1: Project Setup — tsconfig, vitest, dependencies

**Files:**
- Modify: `packages/ui/tsconfig.json`
- Modify: `packages/ui/package.json`
- Create: `packages/ui/vitest.config.ts`

**Step 1: Update tsconfig.json to support JSX**

Add `jsx: "react-jsx"` to compilerOptions since this package has `.tsx` files.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

**Step 2: Update package.json — add devDependencies and test script**

Add vitest, @testing-library/react, react, react-dom, @types/react as devDependencies. Add `@cfast/actions` as a dependency (for the client hook). Update the build script to include `.tsx` files. Add test script.

```json
{
  "name": "@cfast/ui",
  "version": "0.0.1",
  "description": "Permission-aware React components with UI library plugins",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./joy": {
      "import": "./dist/joy.js",
      "types": "./dist/joy.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/joy.ts --format esm --dts",
    "dev": "tsup src/index.ts src/joy.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "@mui/joy": ">=5.0.0-beta.0"
  },
  "peerDependenciesMeta": {
    "@mui/joy": {
      "optional": true
    }
  },
  "dependencies": {
    "@cfast/actions": "workspace:*",
    "@cfast/permissions": "workspace:*"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.6.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
```

**Step 4: Install dependencies**

Run: `cd packages/ui && pnpm install`

**Step 5: Verify setup compiles**

Run: `pnpm --filter @cfast/ui typecheck`
Expected: No errors (src/index.ts is just a comment, should pass)

**Step 6: Commit**

```bash
git add packages/ui/tsconfig.json packages/ui/package.json packages/ui/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(ui): project setup — tsconfig jsx, vitest, dependencies"
```

---

### Task 2: Types — shared type definitions

**Files:**
- Create: `packages/ui/src/types.ts`

**Step 1: Write the types file**

These types define the plugin component contract and ActionButton props. They re-export `ClientDescriptor` and `Serializable` from actions for convenience.

```typescript
import type { ReactNode, ComponentType } from "react";
import type { ClientDescriptor, Serializable } from "@cfast/actions/client";

// Re-export for consumer convenience
export type { ClientDescriptor, Serializable };

// --- Plugin component contracts ---

export type ButtonRenderProps = {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  children: ReactNode;
};

export type TooltipRenderProps = {
  content: string;
  children: ReactNode;
};

export type ConfirmDialogRenderProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
};

export type UIPluginComponents = {
  Button: ComponentType<ButtonRenderProps>;
  Tooltip: ComponentType<TooltipRenderProps>;
  ConfirmDialog: ComponentType<ConfirmDialogRenderProps>;
};

// --- ActionButton props ---

export type WhenForbidden = "hide" | "disable" | "show";

export type ActionButtonProps = {
  action: ClientDescriptor;
  actionName: string;
  input?: Serializable;
  whenForbidden?: WhenForbidden;
  confirmation?: string;
  children: ReactNode;
};

// --- PermissionGate props ---

export type PermissionGateProps = {
  action: ClientDescriptor;
  actionName: string;
  input?: Serializable;
  fallback?: ReactNode;
  children: ReactNode;
};
```

**Step 2: Verify it compiles**

Run: `pnpm --filter @cfast/ui typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add packages/ui/src/types.ts
git commit -m "feat(ui): shared type definitions for plugin system and components"
```

---

### Task 3: useActionStatus hook

**Files:**
- Create: `packages/ui/src/use-action-status.ts`
- Create: `packages/ui/src/use-action-status.test.ts`

**Step 1: Write the failing test**

We need to mock `useActions` from `@cfast/actions/client` since it depends on React Router internals (useLoaderData, useFetcher).

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActionStatus } from "./use-action-status.js";
import type { ClientDescriptor } from "@cfast/actions/client";

// Mock @cfast/actions/client
vi.mock("@cfast/actions/client", () => ({
  useActions: vi.fn(),
}));

import { useActions } from "@cfast/actions/client";

const mockUseActions = vi.mocked(useActions);

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["publish", "delete"] as const,
  permissionsKey: "posts",
};

describe("useActionStatus", () => {
  it("returns status for a single action by name", () => {
    const mockSubmit = vi.fn();
    mockUseActions.mockReturnValue({
      publish: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: "No delete permission",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "publish"),
    );

    expect(result.current.permitted).toBe(true);
    expect(result.current.invisible).toBe(false);
    expect(result.current.reason).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("returns invisible status for forbidden action", () => {
    const mockSubmit = vi.fn();
    mockUseActions.mockReturnValue({
      publish: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: "No delete permission",
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "delete"),
    );

    expect(result.current.permitted).toBe(false);
    expect(result.current.invisible).toBe(true);
    expect(result.current.reason).toBe("No delete permission");
  });

  it("calls submit with input when submit is invoked", () => {
    const mockSubmit = vi.fn();
    mockUseActions.mockReturnValue({
      publish: (input) => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: () => mockSubmit(input),
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "publish", { postId: "123" }),
    );

    result.current.submit();
    expect(mockSubmit).toHaveBeenCalledWith({ postId: "123" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/ui test`
Expected: FAIL — module `./use-action-status.js` not found

**Step 3: Write the implementation**

```typescript
import { useActions } from "@cfast/actions/client";
import type { ActionHookResult } from "@cfast/actions/client";
import type { ClientDescriptor, Serializable } from "./types.js";

export type ActionStatus = ActionHookResult;

export function useActionStatus(
  descriptor: ClientDescriptor,
  actionName: string,
  input?: Serializable,
): ActionStatus {
  const actions = useActions(descriptor);
  const actionFn = actions[actionName];
  if (!actionFn) {
    throw new Error(
      `Action "${actionName}" not found in descriptor. Available: ${descriptor.actionNames.join(", ")}`,
    );
  }
  return actionFn(input);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @cfast/ui test`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add packages/ui/src/use-action-status.ts packages/ui/src/use-action-status.test.ts
git commit -m "feat(ui): useActionStatus hook — thin wrapper over useActions for single action"
```

---

### Task 4: PermissionGate component

**Files:**
- Create: `packages/ui/src/permission-gate.tsx`
- Create: `packages/ui/src/permission-gate.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "./permission-gate.js";
import type { ClientDescriptor } from "@cfast/actions/client";

vi.mock("./use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "./use-action-status.js";

const mockUseActionStatus = vi.mocked(useActionStatus);

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["edit"] as const,
  permissionsKey: "posts",
};

describe("PermissionGate", () => {
  it("renders children when permitted", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: true,
      invisible: false,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    render(
      <PermissionGate action={descriptor} actionName="edit">
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Edit Panel")).toBeDefined();
  });

  it("renders nothing when invisible and no fallback", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const { container } = render(
      <PermissionGate action={descriptor} actionName="edit">
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders fallback when invisible", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    render(
      <PermissionGate
        action={descriptor}
        actionName="edit"
        fallback={<div>Upgrade Required</div>}
      >
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Upgrade Required")).toBeDefined();
    expect(screen.queryByText("Edit Panel")).toBeNull();
  });

  it("renders fallback when not permitted (partial permissions)", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "Missing some permissions",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    render(
      <PermissionGate
        action={descriptor}
        actionName="edit"
        fallback={<div>Insufficient Permissions</div>}
      >
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeDefined();
    expect(screen.queryByText("Edit Panel")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/ui test`
Expected: FAIL — cannot resolve `./permission-gate.js`

**Step 3: Write the implementation**

```tsx
import { useActionStatus } from "./use-action-status.js";
import type { PermissionGateProps } from "./types.js";

export function PermissionGate({
  action,
  actionName,
  input,
  fallback = null,
  children,
}: PermissionGateProps) {
  const status = useActionStatus(action, actionName, input);

  if (!status.permitted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @cfast/ui test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/ui/src/permission-gate.tsx packages/ui/src/permission-gate.test.tsx
git commit -m "feat(ui): PermissionGate component — conditionally renders based on action permissions"
```

---

### Task 5: createUIPlugin factory

**Files:**
- Create: `packages/ui/src/create-ui-plugin.tsx`
- Create: `packages/ui/src/create-ui-plugin.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createUIPlugin } from "./create-ui-plugin.js";
import type { ClientDescriptor } from "@cfast/actions/client";
import type {
  ButtonRenderProps,
  TooltipRenderProps,
  ConfirmDialogRenderProps,
} from "./types.js";

vi.mock("./use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "./use-action-status.js";

const mockUseActionStatus = vi.mocked(useActionStatus);

// Minimal test components
function TestButton({ onClick, disabled, loading, children }: ButtonRenderProps) {
  return (
    <button onClick={onClick} disabled={disabled} data-loading={loading}>
      {children}
    </button>
  );
}

function TestTooltip({ content, children }: TooltipRenderProps) {
  return (
    <div data-tooltip={content}>
      {children}
    </div>
  );
}

function TestConfirmDialog({ open, onConfirm, onCancel, message }: ConfirmDialogRenderProps) {
  if (!open) return null;
  return (
    <div role="dialog">
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

const plugin = createUIPlugin({
  Button: TestButton,
  Tooltip: TestTooltip,
  ConfirmDialog: TestConfirmDialog,
});

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["publish"] as const,
  permissionsKey: "posts",
};

describe("createUIPlugin", () => {
  describe("ActionButton", () => {
    it("renders enabled button when permitted", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button).toBeDefined();
      expect(button.getAttribute("disabled")).toBeNull();
    });

    it("renders nothing when invisible (default whenForbidden=disable hides invisible)", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: true,
        reason: "No permission",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      const { container } = render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      expect(container.innerHTML).toBe("");
    });

    it("renders disabled button with tooltip when not permitted but not invisible", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing editor role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("disabled")).toBe("");
      expect(button.closest("[data-tooltip]")?.getAttribute("data-tooltip")).toBe(
        "Missing editor role",
      );
    });

    it("calls submit on click when permitted", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("shows loading state when pending", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: true,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("data-loading")).toBe("true");
      expect(button.getAttribute("disabled")).toBe("");
    });

    it("whenForbidden=hide returns null for non-permitted", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      const { container } = render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          whenForbidden="hide"
        >
          Publish
        </plugin.ActionButton>,
      );

      expect(container.innerHTML).toBe("");
    });

    it("whenForbidden=show renders enabled button even without permission", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          whenForbidden="show"
        >
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("disabled")).toBeNull();
    });

    it("shows confirmation dialog before submitting", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          confirmation="Are you sure?"
        >
          Publish
        </plugin.ActionButton>,
      );

      // Click button — should open dialog, not submit
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Are you sure?")).toBeDefined();

      // Confirm — should submit
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("cancelling confirmation dialog does not submit", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          confirmation="Are you sure?"
        >
          Publish
        </plugin.ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @cfast/ui test`
Expected: FAIL — cannot resolve `./create-ui-plugin.js`

**Step 3: Write the implementation**

```tsx
import { useState, useCallback } from "react";
import { useActionStatus } from "./use-action-status.js";
import type { UIPluginComponents, ActionButtonProps } from "./types.js";

export function createUIPlugin(components: UIPluginComponents) {
  const { Button, Tooltip, ConfirmDialog } = components;

  function ActionButton({
    action,
    actionName,
    input,
    whenForbidden = "disable",
    confirmation,
    children,
  }: ActionButtonProps) {
    const status = useActionStatus(action, actionName, input);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleClick = useCallback(() => {
      if (confirmation) {
        setConfirmOpen(true);
      } else {
        status.submit();
      }
    }, [confirmation, status]);

    const handleConfirm = useCallback(() => {
      setConfirmOpen(false);
      status.submit();
    }, [status]);

    const handleCancel = useCallback(() => {
      setConfirmOpen(false);
    }, []);

    // Invisible: always hide unless whenForbidden=show
    if (status.invisible && whenForbidden !== "show") {
      return null;
    }

    // Not permitted
    if (!status.permitted) {
      if (whenForbidden === "hide") {
        return null;
      }
      if (whenForbidden === "show") {
        return (
          <>
            <Button onClick={handleClick} disabled={false} loading={false}>
              {children}
            </Button>
            {confirmation && (
              <ConfirmDialog
                open={confirmOpen}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                message={confirmation}
              />
            )}
          </>
        );
      }
      // whenForbidden === "disable" (default)
      return (
        <Tooltip content={status.reason ?? "Insufficient permissions"}>
          <Button onClick={handleClick} disabled loading={false}>
            {children}
          </Button>
        </Tooltip>
      );
    }

    // Permitted
    return (
      <>
        <Button
          onClick={handleClick}
          disabled={status.pending}
          loading={status.pending}
        >
          {children}
        </Button>
        {confirmation && (
          <ConfirmDialog
            open={confirmOpen}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            message={confirmation}
          />
        )}
      </>
    );
  }

  return { ActionButton };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @cfast/ui test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/ui/src/create-ui-plugin.tsx packages/ui/src/create-ui-plugin.test.tsx
git commit -m "feat(ui): createUIPlugin factory — builds permission-aware ActionButton from UI primitives"
```

---

### Task 6: Core barrel export (index.ts)

**Files:**
- Modify: `packages/ui/src/index.ts`

**Step 1: Write the barrel export**

```typescript
export { useActionStatus } from "./use-action-status.js";
export type { ActionStatus } from "./use-action-status.js";

export { PermissionGate } from "./permission-gate.js";

export { createUIPlugin } from "./create-ui-plugin.js";

export type {
  UIPluginComponents,
  ButtonRenderProps,
  TooltipRenderProps,
  ConfirmDialogRenderProps,
  ActionButtonProps,
  PermissionGateProps,
  WhenForbidden,
} from "./types.js";
```

**Step 2: Verify build works**

Run: `pnpm --filter @cfast/ui build`
Expected: Build succeeds, generates `dist/index.js` and `dist/index.d.ts`

**Step 3: Commit**

```bash
git add packages/ui/src/index.ts
git commit -m "feat(ui): core barrel export — useActionStatus, PermissionGate, createUIPlugin"
```

---

### Task 7: Joy UI plugin

**Files:**
- Create: `packages/ui/src/joy.tsx`

**Step 1: Write the Joy UI plugin**

This file creates the Joy-specific ActionButton by passing Joy UI components into `createUIPlugin`. Note: `@mui/joy` is an optional peer dep. The `joy.ts` entrypoint is only imported by consumers who have Joy installed.

```tsx
import JoyButton from "@mui/joy/Button";
import JoyTooltip from "@mui/joy/Tooltip";
import JoyModal from "@mui/joy/Modal";
import JoyModalDialog from "@mui/joy/ModalDialog";
import JoyDialogTitle from "@mui/joy/DialogTitle";
import JoyDialogContent from "@mui/joy/DialogContent";
import JoyDialogActions from "@mui/joy/DialogActions";
import JoyCircularProgress from "@mui/joy/CircularProgress";
import { createUIPlugin } from "./create-ui-plugin.js";
import type {
  ButtonRenderProps,
  TooltipRenderProps,
  ConfirmDialogRenderProps,
} from "./types.js";

function JoyPluginButton({ onClick, disabled, loading, children }: ButtonRenderProps) {
  return (
    <JoyButton
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      loadingIndicator={<JoyCircularProgress size="sm" />}
    >
      {children}
    </JoyButton>
  );
}

function JoyPluginTooltip({ content, children }: TooltipRenderProps) {
  return (
    <JoyTooltip title={content} arrow>
      <span>{children}</span>
    </JoyTooltip>
  );
}

function JoyPluginConfirmDialog({
  open,
  onConfirm,
  onCancel,
  message,
}: ConfirmDialogRenderProps) {
  return (
    <JoyModal open={open} onClose={onCancel}>
      <JoyModalDialog>
        <JoyDialogTitle>Confirm</JoyDialogTitle>
        <JoyDialogContent>{message}</JoyDialogContent>
        <JoyDialogActions>
          <JoyButton variant="solid" onClick={onConfirm}>
            Confirm
          </JoyButton>
          <JoyButton variant="plain" onClick={onCancel}>
            Cancel
          </JoyButton>
        </JoyDialogActions>
      </JoyModalDialog>
    </JoyModal>
  );
}

const joyPlugin = createUIPlugin({
  Button: JoyPluginButton,
  Tooltip: JoyPluginTooltip,
  ConfirmDialog: JoyPluginConfirmDialog,
});

export const ActionButton = joyPlugin.ActionButton;

// Re-export core components for convenience
export { PermissionGate } from "./permission-gate.js";
export { useActionStatus } from "./use-action-status.js";
```

**Step 2: Verify build works**

The build may fail because `@mui/joy` is a peer dep and may not be installed in dev. Check if it's available:

Run: `pnpm --filter @cfast/ui build`

If build fails due to missing `@mui/joy`, add it as a devDependency:

Run: `cd packages/ui && pnpm add -D @mui/joy @mui/material @emotion/react @emotion/styled`

Then retry: `pnpm --filter @cfast/ui build`
Expected: Build succeeds, generates `dist/joy.js` and `dist/joy.d.ts`

**Step 3: Verify typecheck passes**

Run: `pnpm --filter @cfast/ui typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/ui/src/joy.tsx packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): Joy UI plugin — ActionButton with tooltip, confirm dialog, loading states"
```

---

### Task 8: Full build + typecheck verification

**Files:** None (verification only)

**Step 1: Run full monorepo build**

Run: `pnpm build`
Expected: All packages build successfully

**Step 2: Run full typecheck**

Run: `pnpm typecheck`
Expected: All packages pass typecheck

**Step 3: Run ui tests**

Run: `pnpm --filter @cfast/ui test`
Expected: All tests pass

**Step 4: Verify exports are correct**

Run: `node -e "import('@cfast/ui').then(m => console.log(Object.keys(m)))"`
Expected: Lists `useActionStatus`, `PermissionGate`, `createUIPlugin`, and type exports

---

### Task 9: Run quality agents

**Step 1: Run api-reviewer agent (Sonnet)**

Check that the public API follows cfast conventions (`createX`, `useX`, etc.) and types are clean.

**Step 2: Run package-boundary agent (Haiku)**

Verify `@cfast/ui` only depends on `@cfast/actions` and `@cfast/permissions` (no circular deps), and that Joy UI is correctly a peer dep.

**Step 3: Run workers-compat agent (Haiku)**

Verify no Node.js built-ins are used.

**Step 4: Run readme-sync agent (Sonnet)**

Verify implementation matches README spec. Note any divergences and update README if the implementation is better.
