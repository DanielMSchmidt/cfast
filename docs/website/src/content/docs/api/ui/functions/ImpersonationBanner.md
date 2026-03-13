---
editUrl: false
next: false
prev: false
title: "ImpersonationBanner"
---

> **ImpersonationBanner**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/impersonation-banner.tsx:24](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/impersonation-banner.tsx#L24)

Persistent banner shown when an admin is impersonating another user.

Reads the current user from `@cfast/auth` via `useCurrentUser()`. When the
user has `isImpersonating` set, renders a warning alert with the impersonated
user's name/email and a "Stop Impersonating" button that posts to `stopAction`.
Hidden when not impersonating.

## Parameters

### props

[`ImpersonationBannerProps`](/api/ui/type-aliases/impersonationbannerprops/)

See [ImpersonationBannerProps](/api/ui/type-aliases/impersonationbannerprops/).

## Returns

`Element` \| `null`

## Example

```tsx
// In your root layout:
<ImpersonationBanner />

// With custom stop action URL:
<ImpersonationBanner stopAction="/api/stop-impersonation" />
```
