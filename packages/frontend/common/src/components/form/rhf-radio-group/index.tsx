import { Controller, useFormContext } from "react-hook-form";
import { Label } from "../../../ui/label";
import { cn } from "../../../utils";

export function RHFRadioGroup({
  name,
  label,
  options,
  helperText,
  slotProps,
  onChange: onCustomChange,
  ...radioGroupProps
}: {
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  helperText?: string;
  onChange?: (value: string) => void;
  slotProps?: {
    label?: Omit<React.ComponentProps<typeof Label>, "children">;
    helperText?: Omit<React.ComponentProps<"p">, "children">;
    radioWrapper?: React.ComponentProps<"div">;
    radioLabel?: Omit<
      React.ComponentProps<typeof Label>,
      "children" | "htmlFor"
    >;
  };
} & Omit<React.ComponentProps<"div">, "children">) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, ...field },
        fieldState: { error },
      }) => {
        const errorMessage = error?.message;

        return (
          <div className="group">
            {label && (
              <Label
                {...slotProps?.label}
                className={cn(
                  "mb-2 inline-block",
                  errorMessage ? "text-destructive" : "text-muted-foreground",
                  slotProps?.label?.className,
                )}
              >
                {label}
              </Label>
            )}

            <div
              {...radioGroupProps}
              className={cn("space-y-2", radioGroupProps.className)}
            >
              {options.map((option) => {
                const radioId = `${name}-${option.value}`;
                const isChecked = value === option.value;

                return (
                  <div
                    key={option.value}
                    {...slotProps?.radioWrapper}
                    className={cn(
                      "flex items-center gap-2",
                      slotProps?.radioWrapper?.className,
                    )}
                  >
                    <input
                      type="radio"
                      id={radioId}
                      checked={isChecked}
                      onChange={() => {
                        onChange(option.value);
                        onCustomChange?.(option.value);
                      }}
                      {...field}
                      className={cn(
                        "border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer focus:ring-2 focus:ring-offset-2",
                        errorMessage &&
                          "border-destructive text-destructive focus:ring-destructive",
                      )}
                    />
                    <Label
                      htmlFor={radioId}
                      {...slotProps?.radioLabel}
                      className={cn(
                        "cursor-pointer text-sm font-normal",
                        errorMessage ? "text-destructive" : "text-foreground",
                        slotProps?.radioLabel?.className,
                      )}
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>

            {(errorMessage || helperText) && (
              <p
                {...slotProps?.helperText}
                className={cn(
                  "mt-1 ps-2 text-sm",
                  errorMessage ? "text-destructive" : "text-muted-foreground",
                  slotProps?.helperText?.className,
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
