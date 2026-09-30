"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@repo/frontend/components/logo";
import { cn } from "@repo/frontend/utils";
import { isActive } from "../is-active";
import { navigation } from "../nav-config";
import type { NavbarType } from "../constants";
import { FullNavItem, MiniNavItem } from "./nav-item";

/**
 * The rail. `grid-rows-[auto_1fr]` pins the logo and lets only the list
 * scroll — the one structural requirement carried over from the original's
 * hand-rolled scroll pane, which is otherwise not worth reproducing.
 */
export function Navbar({
  variant,
  className,
  onNavigate,
}: {
  variant: NavbarType;
  className?: string;
  /** Used by the mobile drawer to close itself on navigation. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const mini = variant === "mini";

  return (
    <nav
      aria-label="Main"
      className={cn(
        "bg-background grid h-full grid-rows-[auto_1fr] overflow-hidden shadow-sm",
        className,
      )}
    >
      <div className={cn("shrink-0", mini ? "p-2" : "ps-3 pe-4 pt-2")}>
        {mini ? (
          <Logo
            src="/assets/logo/logo-sm.png"
            width={37}
            height={37}
            className="mx-auto w-9"
          />
        ) : (
          <Logo className="w-full" />
        )}
      </div>

      <div className="overflow-y-auto pb-4 [scrollbar-gutter:stable]">
        {navigation.map((section, index) => (
          <div key={section.heading ?? `section-${index}`}>
            {section.heading &&
              (mini ? (
                <div
                  className="text-muted-foreground py-2 text-center text-xs"
                  aria-hidden="true"
                >
                  •
                </div>
              ) : (
                <div className="text-muted-foreground px-4 pt-4 pb-1 text-xs font-medium tracking-wide uppercase">
                  {section.heading}
                </div>
              ))}

            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isActive(
                  item.path,
                  pathname,
                  search ? `?${search}` : "",
                  item.matchNested,
                );

                return mini ? (
                  <MiniNavItem key={item.path} item={item} active={active} />
                ) : (
                  <FullNavItem
                    key={item.path}
                    item={item}
                    active={active}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
