import { cn } from "../../utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full container px-6", className)}>
      {children}
    </div>
  );
}
