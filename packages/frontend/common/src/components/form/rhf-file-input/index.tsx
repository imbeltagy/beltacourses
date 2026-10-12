import { Controller, useFormContext } from "react-hook-form";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { cn } from "../../../utils";

/** Holds a single `File` (or `undefined`) in the form, not a `FileList`. */
export function RHFFileInput({
  name,
  label,
  accept,
  helperText,
}: {
  name: string;
  label?: string;
  accept?: string;
  helperText?: string;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, ref }, fieldState: { error } }) => (
        <div className="group">
          {label && (
            <Label
              className={cn(
                "mb-1 inline-block",
                error ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {label}
            </Label>
          )}

          {/* Uncontrolled on purpose: a file input's value cannot be set. */}
          <Input
            ref={ref}
            type="file"
            accept={accept}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.files?.[0])}
          />

          {(error?.message || helperText) && (
            <p
              className={cn(
                "mt-1 ps-2 text-sm",
                error ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {error?.message || helperText}
            </p>
          )}
        </div>
      )}
    />
  );
}
