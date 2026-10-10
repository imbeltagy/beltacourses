"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Menu } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  TooltipProvider,
} from "@repo/frontend/ui";
import { LocaleSwitcher } from "@repo/frontend/components/locale-switcher";
import { usePathname } from "@repo/frontend/i18n/navigation";
import { getDirection } from "@repo/frontend/i18n/routing";
import { cn } from "@repo/frontend/utils";
import {
  HEADER_HEIGHT,
  NAVBAR_TYPE_COOKIE,
  NAVBAR_WIDTH,
  type NavbarType,
} from "../constants";
import type { User } from "../../../types/api/users";
import { AccountMenu } from "./account-menu";
import { Navbar } from "./navbar";

export function DashboardShell({
  children,
  user,
  initialNavbarType,
}: {
  children: React.ReactNode;
  user: User | null;
  initialNavbarType: NavbarType;
}) {
  const t = useTranslations("nav");
  const dir = getDirection(useLocale());
  const [navbarType, setNavbarType] = useState<NavbarType>(initialNavbarType);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // The original left the mobile drawer open across navigation, so tapping a
  // link moved the page behind a drawer the user then had to dismiss.
  useEffect(() => setDrawerOpen(false), [pathname]);

  function toggleNavbar() {
    const next: NavbarType = navbarType === "full" ? "mini" : "full";
    setNavbarType(next);
    // Written here rather than through a server action so the rail collapses
    // instantly; the cookie exists only so the *next* server render starts at
    // the right width. One year, lax, no sensitive content.
    document.cookie = `${NAVBAR_TYPE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  const railWidth = NAVBAR_WIDTH[navbarType];

  // Stacking order: header 20 < rail 30 < toggler 40 < the drawer's own 50.
  // The original used 900/1000/1200 and a 1200 drawer; the ratios are what
  // matter, and staying under shadcn's z-50 overlay is what keeps the mobile
  // drawer from opening *underneath* the fixed header.
  return (
    <TooltipProvider delayDuration={200}>
      {/* Hides the `calc(100% - rail)` arithmetic when a page holds a wide table. */}
      <div
        className="overflow-x-hidden"
        style={
          {
            "--rail-w": `${railWidth}px`,
            "--header-h": `${HEADER_HEIGHT}px`,
          } as React.CSSProperties
        }
      >
        <header
          className={cn(
            "bg-background/70 fixed top-0 end-0 z-20 flex h-(--header-h) items-center gap-2 px-4 backdrop-blur-[10px] sm:px-6",
            "w-full min-[900px]:w-[calc(100%-var(--rail-w))]",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full min-[900px]:hidden"
            aria-label={t("open")}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>

          <div className="grow" />

          <LocaleSwitcher />
          <AccountMenu user={user} />
        </header>

        {/* Desktop rail. Full height, beside the header rather than under it. */}
        <div className="fixed inset-y-0 start-0 z-30 hidden w-(--rail-w) min-[900px]:block">
          <Navbar variant={navbarType} />
        </div>

        {/*
          Deliberately a sibling of the rail, not a child: it is centred on the
          rail's outer edge and would be clipped by the rail's `overflow-hidden`.
        */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleNavbar}
          aria-label={navbarType === "full" ? t("collapse") : t("expand")}
          aria-expanded={navbarType === "full"}
          className="bg-background fixed top-[60px] start-(--rail-w) z-40 hidden size-7 -translate-x-1/2 -translate-y-1/2 rounded-full rtl:translate-x-1/2 min-[900px]:flex"
        >
          <ChevronRight
            className={cn(
              "size-3 transition-transform",
              // Points toward the rail's outer edge to expand, back to collapse.
              (navbarType === "full") !== (dir === "rtl") && "rotate-180",
            )}
            aria-hidden="true"
          />
        </Button>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="start" className="w-[250px] max-w-[95vw] p-0">
            <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
            {/* pt-10 clears the sheet's own close button, which is absolutely
                positioned over the top-right corner and would sit on the logo. */}
            <Navbar
              variant="full"
              className="pt-10 shadow-none"
              onNavigate={() => setDrawerOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="mt-(--header-h) min-h-[calc(100svh-var(--header-h))] w-full pb-8 min-[900px]:ms-(--rail-w) min-[900px]:w-[calc(100%-var(--rail-w))]">
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
