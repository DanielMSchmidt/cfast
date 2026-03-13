---
editUrl: false
next: false
prev: false
title: "UIPluginComponents"
---

> **UIPluginComponents** = `object`

Defined in: [packages/ui/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L10)

Map of component slot names to their styled implementations.
A UI plugin provides these components to replace the headless defaults.

## Properties

### alert

> **alert**: `ComponentType`\<[`AlertSlotProps`](/api/ui/src/type-aliases/alertslotprops/)\>

Defined in: [packages/ui/src/types.ts:44](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L44)

Alert message component for success/error/warning feedback.

***

### appShell

> **appShell**: `ComponentType`\<[`AppShellSlotProps`](/api/ui/src/type-aliases/appshellslotprops/)\>

Defined in: [packages/ui/src/types.ts:33](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L33)

Application shell with sidebar and header layout.

***

### breadcrumb

> **breadcrumb**: `ComponentType`\<[`BreadcrumbSlotProps`](/api/ui/src/type-aliases/breadcrumbslotprops/)\>

Defined in: [packages/ui/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L39)

Breadcrumb navigation trail.

***

### button

> **button**: `ComponentType`\<[`ButtonSlotProps`](/api/ui/src/type-aliases/buttonslotprops/)\>

Defined in: [packages/ui/src/types.ts:13](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L13)

Button component used by ActionButton and other interactive elements.

***

### chip

> **chip**: `ComponentType`\<[`ChipSlotProps`](/api/ui/src/type-aliases/chipslotprops/)\>

Defined in: [packages/ui/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L30)

Chip/badge component for status indicators.

***

### confirmDialog

> **confirmDialog**: `ComponentType`\<[`ConfirmDialogSlotProps`](/api/ui/src/type-aliases/confirmdialogslotprops/)\>

Defined in: [packages/ui/src/types.ts:17](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L17)

Confirmation dialog shown before destructive actions.

***

### dropZone

> **dropZone**: `ComponentType`\<[`DropZoneSlotProps`](/api/ui/src/type-aliases/dropzoneslotprops/)\>

Defined in: [packages/ui/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L47)

Drag-and-drop file upload area.

***

### pageContainer

> **pageContainer**: `ComponentType`\<[`PageContainerSlotProps`](/api/ui/src/type-aliases/pagecontainerslotprops/)\>

Defined in: [packages/ui/src/types.ts:37](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L37)

Page wrapper with title, breadcrumb, and actions.

***

### sidebar

> **sidebar**: `ComponentType`\<[`SidebarSlotProps`](/api/ui/src/type-aliases/sidebarslotprops/)\>

Defined in: [packages/ui/src/types.ts:35](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L35)

Sidebar navigation panel.

***

### table

> **table**: `ComponentType`\<[`TableSlotProps`](/api/ui/src/type-aliases/tableslotprops/)\>

Defined in: [packages/ui/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L20)

Root table element.

***

### tableBody

> **tableBody**: `ComponentType`\<[`TableSectionSlotProps`](/api/ui/src/type-aliases/tablesectionslotprops/)\>

Defined in: [packages/ui/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L24)

Table body section.

***

### tableCell

> **tableCell**: `ComponentType`\<[`TableCellSlotProps`](/api/ui/src/type-aliases/tablecellslotprops/)\>

Defined in: [packages/ui/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L28)

Table cell element (th or td).

***

### tableHead

> **tableHead**: `ComponentType`\<[`TableSectionSlotProps`](/api/ui/src/type-aliases/tablesectionslotprops/)\>

Defined in: [packages/ui/src/types.ts:22](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L22)

Table head section.

***

### tableRow

> **tableRow**: `ComponentType`\<[`TableRowSlotProps`](/api/ui/src/type-aliases/tablerowslotprops/)\>

Defined in: [packages/ui/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L26)

Table row element.

***

### toast

> **toast**: `ComponentType`\<[`ToastSlotProps`](/api/ui/src/type-aliases/toastslotprops/)\>

Defined in: [packages/ui/src/types.ts:42](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L42)

Toast notification container.

***

### tooltip

> **tooltip**: `ComponentType`\<[`TooltipSlotProps`](/api/ui/src/type-aliases/tooltipslotprops/)\>

Defined in: [packages/ui/src/types.ts:15](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L15)

Tooltip wrapper for hover hints.
