import { Controller, useFormContext } from "react-hook-form";
import { FormInput, FormInputProps } from "../form-input";

export function RHFInput({
  name,
  helperText,
  ...props
}: { name: string } & FormInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, ...field }, fieldState: { error } }) => {
        const errorMessage = error?.message;

        return (
          <FormInput
            {...(props as FormInputProps)}
            {...field}
            value={value ?? ""}
            helperText={errorMessage || helperText}
            error={!!error}
          />
        );
      }}
    />
  );
}
