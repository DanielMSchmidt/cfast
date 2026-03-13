---
editUrl: false
next: false
prev: false
title: "AppShellHeader"
---

> **AppShellHeader**(`__namedParameters`): `Element`

Defined in: [packages/ui/src/components/app-shell.tsx:101](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/components/app-shell.tsx#L101)

Header bar for [AppShell](/api/ui/functions/appshell/) with flexible content and an optional user menu.

Renders a horizontal bar at the top of the shell. Pass a [UserMenu](/api/ui/functions/usermenu/)
element via the `userMenu` prop for authenticated user controls.

## Parameters

### \_\_namedParameters

#### children?

`ReactNode`

#### userMenu?

`ReactNode`

## Returns

`Element`

## Example

```tsx
<AppShell.Header userMenu={<UserMenu links={[{ label: "Profile", to: "/profile" }]} />}>
  <Logo />
</AppShell.Header>
```
