---
editUrl: false
next: false
prev: false
title: "EnvValidationError"
---

> **EnvValidationError** = `object`

Defined in: [packages/env/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/env/src/types.ts#L63)

Describes a single validation failure for a binding.

## Properties

### key

> **key**: `string`

Defined in: [packages/env/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/env/src/types.ts#L65)

The binding name that failed validation (e.g., `"DB"`).

***

### message

> **message**: `string`

Defined in: [packages/env/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/env/src/types.ts#L67)

Human-readable description of the validation failure.
