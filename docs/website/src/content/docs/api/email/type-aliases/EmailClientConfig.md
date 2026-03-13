---
editUrl: false
next: false
prev: false
title: "EmailClientConfig"
---

> **EmailClientConfig** = `object`

Defined in: [packages/email/src/types.ts:60](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L60)

Configuration for [createEmailClient](/api/email/functions/createemailclient/).

Both `provider` and `from` accept either a static value or a getter function.
Getter functions are called lazily at send time, which is the Workers-friendly
pattern for accessing env bindings that are not available at module scope.

## Properties

### from

> **from**: `string` \| () => `string`

Defined in: [packages/email/src/types.ts:70](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L70)

Default sender address, or a getter that returns one.
Can be overridden per-message via [SendOptions.from](/api/email/type-aliases/sendoptions/#from).

***

### provider

> **provider**: [`EmailProvider`](/api/email/type-aliases/emailprovider/) \| () => [`EmailProvider`](/api/email/type-aliases/emailprovider/)

Defined in: [packages/email/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/email/src/types.ts#L65)

The delivery backend, or a getter that returns one.
Use a getter when the provider needs env bindings resolved at send time.
