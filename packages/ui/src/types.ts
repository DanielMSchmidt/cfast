import type { ReactNode, ComponentType } from "react";
import type { ClientDescriptor, Serializable } from "@cfast/actions";

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
