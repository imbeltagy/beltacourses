import { getTranslations } from "next-intl/server";
import { Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@repo/frontend/ui";
import { Link } from "@repo/frontend/i18n/navigation";
import { WelcomeWrapper } from "./components/welcome-wrapper";

const SECTIONS = [
  { href: "/users", icon: Users, id: "users", body: "usersBody" },
  { href: "/groups", icon: Shield, id: "groups", body: "groupsBody" },
] as const;

export default async function AdminHomePage() {
  const [t, tNav] = await Promise.all([
    getTranslations("admin.home"),
    getTranslations("nav.items"),
  ]);

  return (
    <WelcomeWrapper description={t("description")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, id, body }) => (
          <Link key={href} href={href} className="group">
            <Card className="hover:border-primary h-full transition-colors">
              <CardHeader className="flex flex-row items-center gap-3">
                <Icon className="text-primary size-6" aria-hidden="true" />
                <h2 className="text-lg font-semibold">{tNav(id)}</h2>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {t(body)}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </WelcomeWrapper>
  );
}
