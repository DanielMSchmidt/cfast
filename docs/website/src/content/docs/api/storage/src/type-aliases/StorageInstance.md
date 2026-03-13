---
editUrl: false
next: false
prev: false
title: "StorageInstance"
---

> **StorageInstance**\<`T`\> = `object`

Defined in: [packages/storage/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L127)

The storage instance returned by [defineStorage](/api/storage/src/functions/definestorage/), providing upload, serve, and URL methods.

## Type Parameters

### T

`T` *extends* [`StorageSchema`](/api/storage/src/type-aliases/storageschema/)

## Properties

### clientConfig()

> **clientConfig**: () => [`ClientStorageConfig`](/api/storage/src/type-aliases/clientstorageconfig/)

Defined in: [packages/storage/src/types.ts:145](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L145)

Extract the client-safe subset of the schema for use with `StorageProvider`.

#### Returns

[`ClientStorageConfig`](/api/storage/src/type-aliases/clientstorageconfig/)

***

### getPublicUrl()

> **getPublicUrl**: (`name`, `key`) => `string`

Defined in: [packages/storage/src/types.ts:139](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L139)

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

Defined in: [packages/storage/src/types.ts:141](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L141)

Generate a time-limited HMAC-signed URL for private file access.

#### Parameters

##### name

keyof `T` & `string`

##### key

`string`

##### options

[`SignedUrlOptions`](/api/storage/src/type-aliases/signedurloptions/)

#### Returns

`Promise`\<`string`\>

***

### handle()

> **handle**: \<`K`\>(`name`, `request`, `ctx`) => `Promise`\<[`UploadResult`](/api/storage/src/type-aliases/uploadresult/)\>

Defined in: [packages/storage/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L131)

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

[`HandleContext`](/api/storage/src/type-aliases/handlecontext/)\<`T`\[`K`\] *extends* [`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<infer I\> ? `I` : `Record`\<`string`, `unknown`\>\>

#### Returns

`Promise`\<[`UploadResult`](/api/storage/src/type-aliases/uploadresult/)\>

***

### schema

> **schema**: `T`

Defined in: [packages/storage/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L129)

The raw schema passed to `defineStorage`.

***

### serve()

> **serve**: (`name`, `key`, `options`) => `Promise`\<`Response`\>

Defined in: [packages/storage/src/types.ts:137](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L137)

Stream a file directly from R2, returning a `Response` with appropriate headers.

#### Parameters

##### name

keyof `T` & `string`

##### key

`string`

##### options

[`ServeOptions`](/api/storage/src/type-aliases/serveoptions/)

#### Returns

`Promise`\<`Response`\>

***

### verifySignedUrl()

> **verifySignedUrl**: (`url`, `options`) => `Promise`\<`boolean`\>

Defined in: [packages/storage/src/types.ts:143](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L143)

Verify that a signed URL has a valid signature and has not expired.

#### Parameters

##### url

`string`

##### options

###### env

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`boolean`\>
