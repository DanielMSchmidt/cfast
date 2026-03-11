import { createElement, type ReactElement } from "react";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import type { ConfirmDialogSlotProps } from "../types.js";

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
  const dialog = createElement(
    ModalDialog,
    { variant: "outlined", role: "alertdialog", sx: { maxWidth: 400 } },
    createElement(Typography, { level: "h4", children: title }),
    description
      ? createElement(Typography, { level: "body-md", sx: { mt: 1 }, children: description })
      : null,
    createElement(
      Stack,
      { direction: "row", spacing: 1, justifyContent: "flex-end", sx: { mt: 2 } },
      createElement(Button, { variant: "plain", color: "neutral", onClick: onClose, children: cancelLabel }),
      createElement(Button, {
        variant: "solid",
        color: variant === "danger" ? "danger" : "primary",
        onClick: onConfirm,
        children: confirmLabel,
      }),
    ),
  );

  return createElement(Modal, { open, onClose, children: dialog });
}
