---
editUrl: false
next: false
prev: false
title: "NavigationProgress"
---

> **NavigationProgress**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/navigation-progress.tsx:22](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/navigation-progress.tsx#L22)

Thin progress bar fixed to the top of the viewport during React Router navigation.

Uses `useNavigation().state` from React Router to detect loading transitions.
Visible when `state === "loading"`, hidden when `state === "idle"`. No
configuration is required beyond dropping it into your root layout.

## Parameters

### props

[`NavigationProgressProps`](/api/ui/type-aliases/navigationprogressprops/)

See [NavigationProgressProps](/api/ui/type-aliases/navigationprogressprops/).

## Returns

`Element` \| `null`

## Example

```tsx
// In your root layout:
<NavigationProgress />

// With custom color:
<NavigationProgress color="#e91e63" />
```
