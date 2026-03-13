---
editUrl: false
next: false
prev: false
title: "createAuthRouteHandlers"
---

> **createAuthRouteHandlers**(`getAuth`): `object`

Defined in: [packages/auth/src/route-handlers.ts:20](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/route-handlers.ts#L20)

Creates loader and action handlers for a React Router auth catch-all route.

Usage in `routes/auth.$.tsx`:
```ts
import { createAuthRouteHandlers } from "@cfast/auth";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

const { loader, action } = createAuthRouteHandlers(() => {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
});

export { loader, action };
```

## Parameters

### getAuth

() => [`AuthInstance`](/api/auth/src/type-aliases/authinstance/)

## Returns

`object`

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
