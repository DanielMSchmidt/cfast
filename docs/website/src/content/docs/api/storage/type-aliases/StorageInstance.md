---
editUrl: false
next: false
prev: false
title: "StorageInstance"
---

> **StorageInstance**\<`T`\> = `object`

Defined in: [packages/storage/src/types.ts:230](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L230)

The storage instance returned by [defineStorage](/api/storage/functions/definestorage/), providing upload, serve, and URL methods.

All methods are scoped to the declared schema — TypeScript enforces that file type
names and input types match the schema definition.

## Example

```ts
const storage = defineStorage({ avatars: filetype({ ... }) });

// Upload
const result = await storage.handle("avatars", request, { env, user });

// Serve
const response = await storage.serve("avatars", result.key, { env });

// Client config for StorageProvider
const config = storage.clientConfig();
```

## Type Parameters

### T

`T` *extends* [`StorageSchema`](/api/storage/type-aliases/storageschema/)

The storage schema type mapping file type names to their configs.

## Properties

### clientConfig()

> **clientConfig**: () => [`ClientStorageConfig`](/api/storage/type-aliases/clientstorageconfig/)

Defined in: [packages/storage/src/types.ts:248](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L248)

Extract the client-safe subset of the schema for use with `StorageProvider`.

#### Returns

[`ClientStorageConfig`](/api/storage/type-aliases/clientstorageconfig/)

***

### getPublicUrl()

> **getPublicUrl**: (`name`, `key`) => `string`

Defined in: [packages/storage/src/types.ts:242](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L242)

Build a public URL for a file in a public bucket.

#### Parameters

##### name

keyof `T` & `string`

##### key

`string`

#### Returns

`string`

***

### getSignedUrl()

> **getSignedUrl**: (`name`, `key`, `options`) => `Promise`\<`string`\>

Defined in: [packages/storage/src/types.ts:244](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L244)

Generate a time-limited HMAC-signed URL for private file access.

#### Parameters

##### name

keyof `T` & `string`

##### key

`string`

##### options

[`SignedUrlOptions`](/api/storage/type-aliases/signedurloptions/)

#### Returns

`Promise`\<`string`\>

***

### handle()

> **handle**: \<`K`\>(`name`, `request`, `ctx`) => `Promise`\<[`UploadResult`](/api/storage/type-aliases/uploadresult/)\>

Defined in: [packages/storage/src/types.ts:234](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L234)

Parse, validate, and upload a file from an incoming request to R2.

#### Type Parameters

##### K

`K` *extends* keyof `T` & `string`

#### Parameters

##### name

`K`

##### request

`Request`

##### ctx

[`HandleContext`](/api/storage/type-aliases/handlecontext/)\<`T`\[`K`\] *extends* [`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<infer I\> ? `I` : `Record`\<`string`, `unknown`\>\>

#### Returns

`Promise`\<[`UploadResult`](/api/storage/type-aliases/uploadresult/)\>

***

### schema

> **schema**: `T`

Defined in: [packages/storage/src/types.ts:232](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L232)

The raw schema passed to `defineStorage`.

***

### serve()

> **serve**: (`name`, `key`, `options`) => `Promise`\<`Response`\>

Defined in: [packages/storage/src/types.ts:240](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L240)

Stream a file directly from R2, returning a `Response` with appropriate headers.

#### Parameters

##### name

keyof `T` & `string`

##### key

`string`

##### options

[`ServeOptions`](/api/storage/type-aliases/serveoptions/)

#### Returns

`Promise`\<`Response`\>

***

### verifySignedUrl()

> **verifySignedUrl**: (`url`, `options`) => `Promise`\<`boolean`\>

Defined in: [packages/storage/src/types.ts:246](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L246)

Verify that a signed URL has a valid signature and has not expired.

#### Parameters

##### url

`string`

##### options

###### env

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`boolean`\>
