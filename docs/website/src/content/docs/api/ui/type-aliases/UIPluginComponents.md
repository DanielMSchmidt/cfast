---
editUrl: false
next: false
prev: false
title: "UIPluginComponents"
---

> **UIPluginComponents** = `object`

Defined in: [packages/ui/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L18)

Map of component slot names to their styled implementations.

A UI plugin provides these components to replace the headless defaults.
Each slot corresponds to a visual primitive used internally by the higher-level
components ([DataTableProps](/api/ui/type-aliases/datatableprops/), [ListViewProps](/api/ui/type-aliases/listviewprops/), [AppShellProps](/api/ui/type-aliases/appshellprops/), etc.).
Plugins only need to implement the slots they care about; missing slots fall back
to unstyled HTML elements.

## See

 - [UIPlugin](/api/ui/type-aliases/uiplugin/) for the plugin wrapper that holds a partial map of these slots.
 - [createUIPlugin](/api/ui/functions/createuiplugin/) for the factory function that creates a plugin.

## Properties

### alert

> **alert**: `ComponentType`\<[`AlertSlotProps`](/api/ui/type-aliases/alertslotprops/)\>

Defined in: [packages/ui/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L52)

Alert message component for success/error/warning feedback.

***

### appShell

> **appShell**: `ComponentType`\<[`AppShellSlotProps`](/api/ui/type-aliases/appshellslotprops/)\>

Defined in: [packages/ui/src/types.ts:41](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L41)

Application shell with sidebar and header layout.

***

### breadcrumb

> **breadcrumb**: `ComponentType`\<[`BreadcrumbSlotProps`](/api/ui/type-aliases/breadcrumbslotprops/)\>

Defined in: [packages/ui/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L47)

Breadcrumb navigation trail.

***

### button

> **button**: `ComponentType`\<[`ButtonSlotProps`](/api/ui/type-aliases/buttonslotprops/)\>

Defined in: [packages/ui/src/types.ts:21](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L21)

Button component used by ActionButton and other interactive elements.

***

### chip

> **chip**: `ComponentType`\<[`ChipSlotProps`](/api/ui/type-aliases/chipslotprops/)\>

Defined in: [packages/ui/src/types.ts:38](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L38)

Chip/badge component for status indicators.

***

### confirmDialog

> **confirmDialog**: `ComponentType`\<[`ConfirmDialogSlotProps`](/api/ui/type-aliases/confirmdialogslotprops/)\>

Defined in: [packages/ui/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L25)

Confirmation dialog shown before destructive actions.

***

### dropZone

> **dropZone**: `ComponentType`\<[`DropZoneSlotProps`](/api/ui/type-aliases/dropzoneslotprops/)\>

Defined in: [packages/ui/src/types.ts:55](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L55)

Drag-and-drop file upload area.

***

### pageContainer

> **pageContainer**: `ComponentType`\<[`PageContainerSlotProps`](/api/ui/type-aliases/pagecontainerslotprops/)\>

Defined in: [packages/ui/src/types.ts:45](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L45)

Page wrapper with title, breadcrumb, and actions.

***

### sidebar

> **sidebar**: `ComponentType`\<[`SidebarSlotProps`](/api/ui/type-aliases/sidebarslotprops/)\>

Defined in: [packages/ui/src/types.ts:43](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L43)

Sidebar navigation panel.

***

### table

> **table**: `ComponentType`\<[`TableSlotProps`](/api/ui/type-aliases/tableslotprops/)\>

Defined in: [packages/ui/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L28)

Root table element.

***

### tableBody

> **tableBody**: `ComponentType`\<[`TableSectionSlotProps`](/api/ui/type-aliases/tablesectionslotprops/)\>

Defined in: [packages/ui/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L32)

Table body section.

***

### tableCell

> **tableCell**: `ComponentType`\<[`TableCellSlotProps`](/api/ui/type-aliases/tablecellslotprops/)\>

Defined in: [packages/ui/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L36)

Table cell element (th or td).

***

### tableHead

> **tableHead**: `ComponentType`\<[`TableSectionSlotProps`](/api/ui/type-aliases/tablesectionslotprops/)\>

Defined in: [packages/ui/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L30)

Table head section.

***

### tableRow

> **tableRow**: `ComponentType`\<[`TableRowSlotProps`](/api/ui/type-aliases/tablerowslotprops/)\>

Defined in: [packages/ui/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L34)

Table row element.

***

### toast

> **toast**: `ComponentType`\<[`ToastSlotProps`](/api/ui/type-aliases/toastslotprops/)\>

Defined in: [packages/ui/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L50)

Toast notification container.

***

### tooltip

> **tooltip**: `ComponentType`\<[`TooltipSlotProps`](/api/ui/type-aliases/tooltipslotprops/)\>

Defined in: [packages/ui/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L23)

Tooltip wrapper for hover hints.
