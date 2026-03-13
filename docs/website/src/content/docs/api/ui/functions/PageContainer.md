---
editUrl: false
next: false
prev: false
title: "PageContainer"
---

> **PageContainer**(`props`): `Element`

Defined in: [packages/ui/src/components/page-container.tsx:36](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/page-container.tsx#L36)

Page wrapper providing a title, breadcrumb trail, tab navigation, and an action toolbar.

Renders via the UI plugin's `pageContainer` and `breadcrumb` slots. Used internally
by [ListView](/api/ui/functions/listview/) and [DetailView](/api/ui/functions/detailview/), but also useful as a standalone page shell
for custom pages.

## Parameters

### props

`PageContainerProps`

See PageContainerProps.

## Returns

`Element`

## Example

```tsx
<PageContainer
  title="Edit Post"
  breadcrumb={[
    { label: "Posts", to: "/posts" },
    { label: post.title },
  ]}
  actions={<ActionButton action={deletePost} input={{ postId }} />}
>
  {/* page content *​/}
</PageContainer>
```
