---
editUrl: false
next: false
prev: false
title: "createAuthRouteHandlers"
---

> **createAuthRouteHandlers**(`getAuth`): `object`

Defined in: [packages/auth/src/route-handlers.ts:30](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/auth/src/route-handlers.ts#L30)

Creates `loader` and `action` handlers for a React Router auth catch-all route.

The returned handlers forward all requests to the Better Auth handler via
the [AuthInstance](/api/auth/type-aliases/authinstance/) obtained from the `getAuth` callback. Use this in
a splat route (e.g., `routes/auth.$.tsx`) to handle magic link callbacks,
passkey endpoints, and other Better Auth API routes.

## Parameters

### getAuth

() => [`AuthInstance`](/api/auth/type-aliases/authinstance/)

A factory function that returns a fully initialized [AuthInstance](/api/auth/type-aliases/authinstance/).
  Called on every request so that the instance uses the correct per-request D1 binding.

## Returns

`object`

An object with `loader` and `action` functions compatible with React Router route modules.

### action()

> **action**: (`__namedParameters`) => `Promise`\<`Response`\> = `handleRequest`

#### Parameters

##### \_\_namedParameters

###### request

`Request`

#### Returns

`Promise`\<`Response`\>

### loader()

> **loader**: (`__namedParameters`) => `Promise`\<`Response`\> = `handleRequest`

#### Parameters

##### \_\_namedParameters

###### request

`Request`

#### Returns

`Promise`\<`Response`\>

## Example

```ts
// routes/auth.$.tsx
import { createAuthRouteHandlers } from "@cfast/auth";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

const { loader, action } = createAuthRouteHandlers(() => {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
});

export { loader, action };
```
