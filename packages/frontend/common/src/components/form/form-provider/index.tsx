import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";

export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  methods,
  ...props
}: {
  methods: UseFormReturn<TFieldValues>;
} & React.ComponentProps<"form">) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}
