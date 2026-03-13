---
editUrl: false
next: false
prev: false
title: "useConfirm"
---

> **useConfirm**(): `ConfirmFn`

Defined in: [packages/ui/src/hooks/use-confirm.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/hooks/use-confirm.ts#L47)

Returns an imperative ConfirmFn that opens a confirmation dialog
and resolves to `true` (confirmed) or `false` (cancelled/dismissed).

Must be used within a `ConfirmProvider` -- typically supplied by the
Joy UI plugin or a custom UI plugin implementation.

## Returns

`ConfirmFn`

A ConfirmFn that accepts [ConfirmOptions](/api/ui/type-aliases/confirmoptions/) and returns a `Promise<boolean>`.

## Throws

If called outside of a `ConfirmProvider`.

## Example

```ts
function DangerZone() {
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete account",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) { /* proceed */ }
  }

  return <button onClick={handleDelete}>Delete</button>;
}
```
