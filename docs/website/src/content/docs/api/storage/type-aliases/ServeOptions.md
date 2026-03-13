---
editUrl: false
next: false
prev: false
title: "ServeOptions"
---

> **ServeOptions** = `object`

Defined in: [packages/storage/src/types.ts:201](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L201)

Options for serving a file directly from R2 as an HTTP response.

The resulting `Response` streams the file body and includes R2 HTTP metadata
(content-type, etag, etc.) plus any additional headers you specify.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:203](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L203)

Workers environment bindings (must include the target R2 bucket).

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/storage/src/types.ts:205](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L205)

Additional response headers to include (e.g. `Cache-Control`).
