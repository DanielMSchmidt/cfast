---
editUrl: false
next: false
prev: false
title: "getInitials"
---

> **getInitials**(`name`): `string`

Defined in: [packages/ui/src/components/avatar-with-initials.tsx:17](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/components/avatar-with-initials.tsx#L17)

Extracts up to two uppercase initials from a full name.

Splits the name on spaces and takes the first character of each part.

## Parameters

### name

`string`

The full name to extract initials from.

## Returns

`string`

A string of 1-2 uppercase characters (e.g. `"DS"` for `"Daniel Schmidt"`).

## Example

```ts
getInitials("Daniel Schmidt"); // "DS"
getInitials("Alice");          // "A"
```
