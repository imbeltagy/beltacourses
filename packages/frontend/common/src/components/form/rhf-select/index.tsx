import { Controller, useFormContext } from "react-hook-form";
import { Label } from "../../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { cn } from "../../../utils";

export function RHFSelect({
  name,
  label,
  options,
  placeholder,
  helperText,
  disabled,
  className,
}: {
  name: string;
  label?: string;
  /** Values must be non-empty: Radix reserves `""` for "no selection". */
  options: { value: string; label: string }[];
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const errorMessage = error?.message;

        return (
          <div className="group">
            {label && (
              <Label
                className={cn(
                  "mb-1 inline-block",
                  errorMessage ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {label}
              </Label>
            )}

            <Select
              value={value ?? ""}
              onValueChange={onChange}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn("w-full", className)}
                aria-invalid={!!errorMessage}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(errorMessage || helperText) && (
              <p
                className={cn(
                  "mt-1 ps-2 text-sm",
                  errorMessage ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {errorMessage || helperText}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
