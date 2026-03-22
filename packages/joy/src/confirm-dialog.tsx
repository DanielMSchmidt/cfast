import { type ReactElement } from "react";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import type { ConfirmDialogSlotProps } from "@cfast/ui";

/**
 * Joy UI ConfirmDialog — Modal + ModalDialog based on the example app pattern.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogSlotProps): ReactElement {
  const dialog = (
    <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 400 }}>
      <Typography level="h4">{title}</Typography>
      {description
        ? <Typography level="body-md" sx={{ mt: 1 }}>{description}</Typography>
        : null}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="plain" color="neutral" onClick={onClose}>{cancelLabel}</Button>
        <Button
          variant="solid"
          color={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </Stack>
    </ModalDialog>
  );

  return <Modal open={open} onClose={onClose}>{dialog}</Modal>;
}
