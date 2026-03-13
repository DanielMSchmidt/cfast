---
editUrl: false
next: false
prev: false
title: "EnvironmentName"
---

> **EnvironmentName** = `"development"` \| `"staging"` \| `"production"`

Defined in: [packages/env/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L47)

Valid Cloudflare Worker environment names.

Determined by the reserved `ENVIRONMENT` binding in `rawEnv`.
Defaults to `"development"` when absent.
