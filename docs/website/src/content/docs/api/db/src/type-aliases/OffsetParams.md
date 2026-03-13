---
editUrl: false
next: false
prev: false
title: "OffsetParams"
---

> **OffsetParams** = `object`

Defined in: [packages/db/src/types.ts:108](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L108)

Parsed offset-based pagination parameters from a request URL.

## Properties

### limit

> **limit**: `number`

Defined in: [packages/db/src/types.ts:114](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L114)

Maximum items per page.

***

### page

> **page**: `number`

Defined in: [packages/db/src/types.ts:112](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L112)

The 1-based page number.

***

### type

> **type**: `"offset"`

Defined in: [packages/db/src/types.ts:110](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L110)

Discriminant for offset pagination.
