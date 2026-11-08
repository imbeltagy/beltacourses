"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut, UserCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/frontend/ui";
import { logoutAction } from "../../../actions/auth-actions";
import type { User } from "../../../types/api/users";

export function AccountMenu({ user }: { user: User | null }) {
  const t = useTranslations("nav");
  const [pending, startTransition] = useTransition();

  function signOut() {
    // Logout reloads the page; the guard then redirects to /login.
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("accountMenu")}
        >
          {user?.avatar ? (
            <Avatar className="size-8">
              <AvatarImage src={user.avatar.url} alt="" />
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="size-7" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate font-medium">
            {user?.name ?? t("signedIn")}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            {user?.email ?? ""}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(event) => {
            // Without this the menu closes and unmounts mid-transition.
            event.preventDefault();
            signOut();
          }}
        >
          <LogOut aria-hidden="true" />
          {pending ? t("signingOut") : t("logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
