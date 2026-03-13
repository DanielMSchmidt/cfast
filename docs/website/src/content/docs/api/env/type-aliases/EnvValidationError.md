---
editUrl: false
next: false
prev: false
title: "EnvValidationError"
---

> **EnvValidationError** = `object`

Defined in: [packages/env/src/types.ts:160](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L160)

Describes a single validation failure for a binding.

Multiple failures are collected during `init()` and bundled into a single
[EnvError](/api/env/classes/enverror/) so all issues can be fixed in one pass.

## Properties

### key

> **key**: `string`

Defined in: [packages/env/src/types.ts:162](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L162)

The binding name that failed validation (e.g., `"DB"`).

***

### message

> **message**: `string`

Defined in: [packages/env/src/types.ts:164](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L164)

Human-readable description of the validation failure.
