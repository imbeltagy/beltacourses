import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { cn } from "../../../utils";
import { Textarea } from "../../../ui/textarea";

interface InputType extends React.ComponentProps<"input"> {
  multiline?: false;
}
interface TextareaType extends React.ComponentProps<"textarea"> {
  multiline: true;
}

export type FormInputProps = {
  label?: string;
  helperText?: string;
  multiline?: boolean;
  error?: boolean;
  slotProps?: {
    label?: Omit<React.ComponentProps<typeof Label>, "children">;
    helperText?: Omit<React.ComponentProps<"p">, "children">;
  };
} & (InputType | TextareaType);

export function FormInput({
  label,
  helperText,
  multiline,
  error,
  slotProps,
  ...inputProps
}: FormInputProps) {
  const Component = multiline ? Textarea : Input;

  return (
    <div className="group">
      {label && (
        <Label
          {...slotProps?.label}
          className={cn(
            "mb-1 inline-block",
            error
              ? "text-destructive"
              : "text-muted-foreground group-has-focus-visible:text-primary",
            slotProps?.label?.className,
          )}
        >
          {label}
        </Label>
      )}

      <Component
        // Component is a union of two element types; TS can't narrow a spread onto it.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(inputProps as any)}
        className={cn(
          error
            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
            : "",
          inputProps.className,
        )}
      />

      {helperText && (
        <p
          {...slotProps?.helperText}
          className={cn(
            "mt-1 ps-2 text-sm",
            error ? "text-destructive" : "text-muted-foreground",
            slotProps?.helperText?.className,
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
