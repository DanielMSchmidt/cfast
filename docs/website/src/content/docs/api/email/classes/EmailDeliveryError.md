---
editUrl: false
next: false
prev: false
title: "EmailDeliveryError"
---

Defined in: [packages/email/src/errors.ts:22](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/errors.ts#L22)

Error thrown when an [EmailProvider](/api/email/type-aliases/emailprovider/) fails to deliver a message.

Contains provider-specific context such as the HTTP status code and raw
response body for debugging delivery failures.

## Example

```ts
import { EmailDeliveryError } from "@cfast/email";

try {
  await email.send({ to, subject, react: <Template /> });
} catch (error) {
  if (error instanceof EmailDeliveryError) {
    console.error(error.provider);    // "mailgun"
    console.error(error.statusCode);  // 401
    console.error(error.response);    // "Unauthorized"
  }
}
```

## Extends

- `Error`

## Constructors

### Constructor

> **new EmailDeliveryError**(`message`, `options`): `EmailDeliveryError`

Defined in: [packages/email/src/errors.ts:34](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/errors.ts#L34)

#### Parameters

##### message

`string`

Human-readable error description.

##### options

Provider context for the failure.

###### provider

`string`

###### response?

`string`

###### statusCode?

`number`

#### Returns

`EmailDeliveryError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

`Error.cause`

***

### message

> **message**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.name`

***

### provider

> `readonly` **provider**: `string`

Defined in: [packages/email/src/errors.ts:24](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/errors.ts#L24)

The name of the provider that failed (e.g. `"mailgun"`).

***

### response?

> `readonly` `optional` **response**: `string`

Defined in: [packages/email/src/errors.ts:28](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/errors.ts#L28)

Raw response body from the provider's API, if available.

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`

***

### statusCode?

> `readonly` `optional` **statusCode**: `number`

Defined in: [packages/email/src/errors.ts:26](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/email/src/errors.ts#L26)

HTTP status code returned by the provider's API, if available.
