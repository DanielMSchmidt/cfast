---
editUrl: false
next: false
prev: false
title: "EnvValidationError"
---

> **EnvValidationError** = `object`

Defined in: [packages/env/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L63)

Describes a single validation failure for a binding.

## Properties

### key

> **key**: `string`

Defined in: [packages/env/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L65)

The binding name that failed validation (e.g., `"DB"`).

***

### message

> **message**: `string`

Defined in: [packages/env/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L67)

Human-readable description of the validation failure.
