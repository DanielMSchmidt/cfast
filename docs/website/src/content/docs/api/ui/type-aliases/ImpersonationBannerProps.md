---
editUrl: false
next: false
prev: false
title: "ImpersonationBannerProps"
---

> **ImpersonationBannerProps** = `object`

Defined in: [packages/ui/src/types.ts:1334](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1334)

Props for the ImpersonationBanner component.

Persistent banner shown when an admin is impersonating another user. Reads
impersonation state from `@cfast/auth`. Hidden automatically when not
impersonating. Displays the impersonated user's email and a "Stop Impersonating"
button that submits to the configured `stopAction` URL.

## Properties

### stopAction?

> `optional` **stopAction**: `string`

Defined in: [packages/ui/src/types.ts:1336](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1336)

Form action URL for stopping impersonation. Defaults to "/admin/stop-impersonation".
