---
editUrl: false
next: false
prev: false
title: "FormStatus"
---

> **FormStatus**(`props`): `Element` \| `null`

Defined in: [packages/ui/src/components/form-status.tsx:27](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/components/form-status.tsx#L27)

Displays action result feedback (success, error, and field-level validation messages).

Renders alerts via the UI plugin's `alert` slot. Success messages are shown
in green, errors in red, and field-level validation errors as a bulleted list.
Returns `null` when there is no feedback to display.

## Parameters

### props

[`FormStatusProps`](/api/ui/type-aliases/formstatusprops/)

See [FormStatusProps](/api/ui/type-aliases/formstatusprops/).

## Returns

`Element` \| `null`

## Example

```tsx
function EditForm() {
  const actionData = useActionData();
  return (
    <Form method="post">
      <FormStatus data={actionData} />
      {/* form fields *​/}
    </Form>
  );
}
```
