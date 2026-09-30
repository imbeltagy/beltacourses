import { Home, Shield, Users, type LucideIcon } from "lucide-react";

/**
 * Flat by design — the original had no nesting, no collapsible groups, and
 * three items. `heading` renders a divider with a caption in the full rail and
 * collapses to a dot in the mini one.
 */
export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  /**
   * Highlight the item for any path beneath it, not just an exact match.
   * Off for `/`, or it would match everything.
   */
  matchNested?: boolean;
};

export type NavSection = {
  heading?: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    items: [{ path: "/", label: "Home", icon: Home }],
  },
  {
    heading: "Administration",
    items: [
      { path: "/users", label: "Users", icon: Users, matchNested: true },
      { path: "/groups", label: "Groups", icon: Shield, matchNested: true },
    ],
  },
];
