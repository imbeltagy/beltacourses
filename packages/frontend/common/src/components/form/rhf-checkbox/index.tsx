import { Controller, useFormContext } from "react-hook-form";
import { Label } from "../../../ui/label";
import { cn } from "../../../utils";

export function RHFCheckbox({
  name,
  label,
  helperText,
  disabled,
}: {
  name: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, ref }, fieldState: { error } }) => (
        <div>
          <div className="flex items-center gap-2">
            <input
              ref={ref}
              type="checkbox"
              id={name}
              checked={!!value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.checked)}
              className="border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded focus:ring-2 focus:ring-offset-2"
            />
            <Label htmlFor={name} className="cursor-pointer font-normal">
              {label}
            </Label>
          </div>

          {(error?.message || helperText) && (
            <p
              className={cn(
                "mt-1 ps-6 text-sm",
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
