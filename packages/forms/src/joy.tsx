import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Input from "@mui/joy/Input";
import Checkbox from "@mui/joy/Checkbox";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { createFormPlugin } from "./plugin";
import { createAutoForm } from "./auto-form";
import type {
  ChildTableComponentProps,
  FieldComponentProps,
  FieldDefinition,
  FormPlugin,
  FormWrapperProps,
  SubmitButtonProps,
} from "./types";

function JoyTextInput({ name, label, placeholder, required, readOnly, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Input
        placeholder={placeholder}
        {...register(name)}
        required={required}
        readOnly={readOnly}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyNumberInput({ name, label, placeholder, required, readOnly, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Input
        type="number"
        placeholder={placeholder}
        {...register(name, { valueAsNumber: true })}
        required={required}
        readOnly={readOnly}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoySelect({ name, label, required, readOnly, error, enumValues, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <select
        id={name}
        {...register(name)}
        aria-required={required}
        disabled={readOnly}
      >
        <option value="">Select...</option>
        {enumValues?.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyCheckbox({ name, label, readOnly, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <Checkbox id={name} label={label} {...register(name)} disabled={readOnly} />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyFormWrapper({ onSubmit, children }: FormWrapperProps) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {children}
    </Box>
  );
}

function JoySubmitButton({ isSubmitting, children }: SubmitButtonProps) {
  return (
    <Button type="submit" loading={isSubmitting}>
      {children}
    </Button>
  );
}

function pickJoyComponent(plugin: FormPlugin, field: FieldDefinition) {
  switch (field.inputType) {
    case "number":
      return plugin.components.numberInput;
    case "checkbox":
      return plugin.components.checkbox;
    case "select":
      return plugin.components.select;
    default:
      return plugin.components.textInput;
  }
}

function JoyChildTable({
  name,
  label,
  fields,
  fieldOverrides,
  rowIds,
  canAddRow,
  canRemoveRow,
  reorderable,
  onAddRow,
  onRemoveRow,
  onMoveUp,
  onMoveDown,
  error,
  form,
  plugin,
}: ChildTableComponentProps) {
  return (
    <Box
      data-cfast-child-table={name}
      sx={{
        border: "1px solid",
        borderColor: "neutral.outlinedBorder",
        borderRadius: "md",
        p: 2,
      }}
    >
      <Typography level="title-md" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {error && (
        <Typography level="body-sm" color="danger" role="alert" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      <Stack spacing={1.5}>
        {rowIds.map((rowId, index) => (
          <Box
            key={rowId}
            data-cfast-child-row={index}
            sx={{
              p: 1.5,
              borderRadius: "sm",
              backgroundColor: "background.level1",
            }}
          >
            <Stack spacing={1}>
              {fields.map((field) => {
                const override = fieldOverrides?.[field.name];
                if (override?.hidden) return null;
                const Component =
                  override?.component ?? pickJoyComponent(plugin, field);
                const fieldName = `${name}.${index}.${field.name}`;
                const errors = form.formState.errors[name];
                const rowError =
                  Array.isArray(errors) && errors[index]
                    ? (errors[index] as Record<string, { message?: string }>)
                    : undefined;
                const message = rowError?.[field.name]?.message;
                return (
                  <Component
                    key={field.name}
                    name={fieldName}
                    label={override?.label ?? field.label}
                    placeholder={override?.placeholder}
                    required={field.required}
                    readOnly={override?.readOnly || !!override?.computed}
                    error={typeof message === "string" ? message : undefined}
                    enumValues={field.enumValues}
                    register={form.register}
                  />
                );
              })}
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                {reorderable && (
                  <>
                    <IconButton
                      size="sm"
                      variant="plain"
                      aria-label={`Move ${label} row ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => onMoveUp(index)}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="plain"
                      aria-label={`Move ${label} row ${index + 1} down`}
                      disabled={index === rowIds.length - 1}
                      onClick={() => onMoveDown(index)}
                    >
                      ↓
                    </IconButton>
                  </>
                )}
                <Button
                  size="sm"
                  variant="plain"
                  color="danger"
                  aria-label={`Remove ${label} row ${index + 1}`}
                  disabled={!canRemoveRow}
                  onClick={() => onRemoveRow(index)}
                >
                  Remove
                </Button>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Button
        size="sm"
        variant="outlined"
        color="neutral"
        aria-label={`Add ${label} row`}
        disabled={!canAddRow}
        onClick={onAddRow}
        sx={{ mt: 1.5 }}
      >
        + Add {label.endsWith("s") ? label.slice(0, -1) : label}
      </Button>
    </Box>
  );
}

const joyPlugin = createFormPlugin({
  components: {
    textInput: JoyTextInput,
    numberInput: JoyNumberInput,
    select: JoySelect,
    checkbox: JoyCheckbox,
    form: JoyFormWrapper,
    submitButton: JoySubmitButton,
    childTable: JoyChildTable,
  },
});

export const AutoForm = createAutoForm(joyPlugin);
