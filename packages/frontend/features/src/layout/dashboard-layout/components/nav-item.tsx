"use client";

import Link from "next/link";
import { cn } from "@repo/frontend/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/frontend/ui";
import type { NavItem as NavItemType } from "../nav-config";

/**
 * A real `<Link>`, unlike the original's `role="button"` div driven by
 * `router.push` — that lost prefetch, middle-click, open-in-new-tab and the
 * correct screen-reader role.
 */
export function FullNavItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItemType;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    // The pe-4 inset is what makes the pill look attached to the rail's edge.
    <li className="pe-4">
      <Link
        href={item.path}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 py-2 ps-4 pe-4 text-sm transition-colors",
          "rounded-e-full",
          active
            ? "from-primary/95 to-primary bg-gradient-to-r text-white"
            : "text-foreground hover:bg-primary/10",
        )}
      >
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

/**
 * Icon-only. The tooltip is not the accessible name — `aria-label` is, because
 * a tooltip does not name its trigger for assistive tech.
 */
export function MiniNavItem({
  item,
  active,
}: {
  item: NavItemType;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.path}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex aspect-5/4 items-center justify-center transition-colors",
              active
                ? "from-primary/80 to-primary/95 bg-radial text-white"
                : "text-foreground hover:bg-primary/10",
            )}
          >
            <Icon className="size-6 shrink-0" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    </li>
  );
}
