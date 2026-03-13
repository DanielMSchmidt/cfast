---
editUrl: false
next: false
prev: false
title: "AppShellSidebar"
---

> **AppShellSidebar**(`__namedParameters`): `Element`

Defined in: [packages/ui/src/components/app-shell.tsx:46](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/app-shell.tsx#L46)

Sidebar navigation for [AppShell](/api/ui/functions/appshell/) that automatically filters items by permission.

Each [NavigationItem](/api/ui/type-aliases/navigationitem/) can optionally carry an `action` descriptor. Items whose
action is invisible or forbidden are hidden from the sidebar automatically.

## Parameters

### \_\_namedParameters

#### items

[`NavigationItem`](/api/ui/type-aliases/navigationitem/)[]

## Returns

`Element`

## Example

```tsx
<AppShell.Sidebar items={[
  { label: "Posts", to: "/posts", icon: DocumentIcon },
  { label: "Users", to: "/users", icon: UsersIcon, action: manageUsers.client },
]} />
```
