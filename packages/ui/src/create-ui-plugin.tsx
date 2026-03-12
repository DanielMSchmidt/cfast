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
      if (!status.permitted && whenForbidden !== "show") return;
      if (confirmation) {
        setConfirmOpen(true);
      } else {
        status.submit();
      }
    }, [confirmation, status.submit, status.permitted, whenForbidden]);

    const handleConfirm = useCallback(() => {
      setConfirmOpen(false);
      status.submit();
    }, [status.submit]);

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
