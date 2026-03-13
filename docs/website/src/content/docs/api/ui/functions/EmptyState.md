---
editUrl: false
next: false
prev: false
title: "EmptyState"
---

> **EmptyState**(`props`): `Element`

Defined in: [packages/ui/src/components/empty-state.tsx:28](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/empty-state.tsx#L28)

Permission-aware empty state placeholder.

Adapts its content based on the user's permissions for the create action:

- **Permitted**: shows title, description, and a CTA button
- **Forbidden**: shows title and description without the CTA
- **Invisible**: shows a generic "Nothing here yet" message
- **No createAction**: shows title and description only

## Parameters

### props

[`EmptyStateProps`](/api/ui/type-aliases/emptystateprops/)

See [EmptyStateProps](/api/ui/type-aliases/emptystateprops/).

## Returns

`Element`

## Example

```tsx
<EmptyState
  title="No posts yet"
  description="Create your first blog post to get started."
  createAction={createPost.client}
  createLabel="New Post"
  icon={DocumentIcon}
/>
```
