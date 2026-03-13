---
editUrl: false
next: false
prev: false
title: "EnvironmentName"
---

> **EnvironmentName** = `"development"` \| `"staging"` \| `"production"`

Defined in: [packages/env/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/env/src/types.ts#L47)

Valid Cloudflare Worker environment names.

Determined by the reserved `ENVIRONMENT` binding in `rawEnv`.
Defaults to `"development"` when absent.
