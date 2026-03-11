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
