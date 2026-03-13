---
editUrl: false
next: false
prev: false
title: "EnvironmentName"
---

> **EnvironmentName** = `"development"` \| `"staging"` \| `"production"`

Defined in: [packages/env/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/types.ts#L47)

Valid Cloudflare Worker environment names.

Determined by the reserved `ENVIRONMENT` binding in `rawEnv`.
Defaults to `"development"` when absent.
