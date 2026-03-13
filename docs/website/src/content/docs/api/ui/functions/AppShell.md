---
editUrl: false
next: false
prev: false
title: "AppShell"
---

> **AppShell**(`props`): `Element`

Defined in: [packages/ui/src/components/app-shell.tsx:25](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/app-shell.tsx#L25)

Base application layout with sidebar navigation, header, and content area.

Delegates rendering to the UI plugin's `appShell` slot. Compose with
[AppShellSidebar](/api/ui/functions/appshellsidebar/) (`AppShell.Sidebar`) and [AppShellHeader](/api/ui/functions/appshellheader/)
(`AppShell.Header`) for a complete layout.

## Parameters

### props

[`AppShellProps`](/api/ui/type-aliases/appshellprops/)

See [AppShellProps](/api/ui/type-aliases/appshellprops/).

## Returns

`Element`

## Example

```tsx
<AppShell
  sidebar={<AppShell.Sidebar items={navigationItems} />}
  header={<AppShell.Header userMenu={<UserMenu />} />}
>
  {children}
</AppShell>
```
