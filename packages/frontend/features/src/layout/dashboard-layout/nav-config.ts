import { Home, Shield, Users, type LucideIcon } from "lucide-react";

/**
 * Labels are message keys under `nav.items` / `nav.headings`, not strings —
 * this file is data and the components translate.
 *
 * Flat by design — the original had no nesting, no collapsible groups, and
 * three items. `heading` renders a divider with a caption in the full rail and
 * collapses to a dot in the mini one.
 */
export type NavItem = {
  path: string;
  id: "home" | "users" | "groups";
  icon: LucideIcon;
  /**
   * Highlight the item for any path beneath it, not just an exact match.
   * Off for `/`, or it would match everything.
   */
  matchNested?: boolean;
};

export type NavSection = {
  heading?: "administration";
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    items: [{ path: "/", id: "home", icon: Home }],
  },
  {
    heading: "administration",
    items: [
      { path: "/users", id: "users", icon: Users, matchNested: true },
      { path: "/groups", id: "groups", icon: Shield, matchNested: true },
    ],
  },
];
