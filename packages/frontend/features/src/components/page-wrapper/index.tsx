import { cn } from "@repo/frontend/utils";

/**
 * The page shell the dashboard layout expects inside it. Title, icon and the
 * primary action live here rather than in the header — same split as the
 * project this layout came from.
 */
export function PageWrapper({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** Usually a primary button, right-aligned against the title. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1536px] px-4 py-6 sm:px-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {action}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
