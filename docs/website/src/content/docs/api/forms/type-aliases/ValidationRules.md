---
editUrl: false
next: false
prev: false
title: "ValidationRules"
---

> **ValidationRules** = `object`

Defined in: [packages/forms/src/types.ts:19](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L19)

Validation rules that can be attached to a Drizzle column via the [v](/api/forms/functions/v/) helper.

These rules are stored as metadata on the column builder and read back by
[introspectTable](/api/forms/functions/introspecttable/) to generate client-side validation via [createResolver](/api/forms/functions/createresolver/).

## Example

```ts
import { v } from "@cfast/forms";
import { text, integer } from "drizzle-orm/sqlite-core";

const title = v(text("title").notNull(), { minLength: 3, maxLength: 200 });
const views = v(integer("views"), { min: 0, message: "Views cannot be negative" });
```

## Properties

### max?

> `optional` **max**: `number`

Defined in: [packages/forms/src/types.ts:27](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L27)

Maximum numeric value. Applied to number inputs.

***

### maxLength?

> `optional` **maxLength**: `number`

Defined in: [packages/forms/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L23)

Maximum string length. Applied to text/varchar inputs.

***

### message?

> `optional` **message**: `string`

Defined in: [packages/forms/src/types.ts:31](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L31)

Custom error message displayed when any rule fails. Overrides the auto-generated message.

***

### min?

> `optional` **min**: `number`

Defined in: [packages/forms/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L25)

Minimum numeric value. Applied to number inputs.

***

### minLength?

> `optional` **minLength**: `number`

Defined in: [packages/forms/src/types.ts:21](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L21)

Minimum string length. Applied to text/varchar inputs.

***

### pattern?

> `optional` **pattern**: `RegExp`

Defined in: [packages/forms/src/types.ts:29](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/forms/src/types.ts#L29)

Regex pattern the string value must match.
