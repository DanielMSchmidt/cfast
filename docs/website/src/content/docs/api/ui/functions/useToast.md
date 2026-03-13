---
editUrl: false
next: false
prev: false
title: "useToast"
---

> **useToast**(): [`ToastApi`](/api/ui/type-aliases/toastapi/)

Defined in: [packages/ui/src/hooks/use-toast.ts:40](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/hooks/use-toast.ts#L40)

Returns an imperative [ToastApi](/api/ui/type-aliases/toastapi/) for showing toast notifications.

Provides convenience methods (`success`, `error`, `info`, `warning`) as well
as a generic `show` method that accepts full [ToastOptions](/api/ui/type-aliases/toastoptions/).

Must be used within a `ToastProvider` -- typically supplied by the Joy UI
plugin (backed by Sonner) or a custom UI plugin implementation.

## Returns

[`ToastApi`](/api/ui/type-aliases/toastapi/)

A [ToastApi](/api/ui/type-aliases/toastapi/) object with methods for each notification type.

## Throws

If called outside of a `ToastProvider`.

## Example

```ts
function PublishButton() {
  const toast = useToast();

  async function handlePublish() {
    try {
      await publishPost();
      toast.success("Post published");
    } catch (err) {
      toast.error("Failed to publish post");
    }
  }

  return <button onClick={handlePublish}>Publish</button>;
}
```
