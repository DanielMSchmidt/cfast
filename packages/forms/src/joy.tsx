import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Input from "@mui/joy/Input";
import Checkbox from "@mui/joy/Checkbox";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { createFormPlugin } from "./plugin";
import { createAutoForm } from "./auto-form";
import type { FieldComponentProps, FormWrapperProps, SubmitButtonProps } from "./types";

function JoyTextInput({ name, label, placeholder, required, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Input
        placeholder={placeholder}
        {...register(name)}
        required={required}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyNumberInput({ name, label, placeholder, required, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Input
        type="number"
        placeholder={placeholder}
        {...register(name, { valueAsNumber: true })}
        required={required}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoySelect({ name, label, required, error, enumValues, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <select id={name} {...register(name)} aria-required={required}>
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

function JoyCheckbox({ name, label, error, register }: FieldComponentProps) {
  return (
    <FormControl error={!!error}>
      <Checkbox id={name} label={label} {...register(name)} />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

function JoyFormWrapper({ onSubmit, children, method, formRef }: FormWrapperProps) {
  return (
    <Box component="form" onSubmit={onSubmit} method={method} ref={formRef} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

const joyPlugin = createFormPlugin({
  components: {
    textInput: JoyTextInput,
    numberInput: JoyNumberInput,
    select: JoySelect,
    checkbox: JoyCheckbox,
    form: JoyFormWrapper,
    submitButton: JoySubmitButton,
  },
});

export const AutoForm = createAutoForm(joyPlugin);
