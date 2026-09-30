import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@repo/frontend/ui";
import { getCurrentUserAction } from "../../../actions/users-actions";
import { PageWrapper } from "../../../components/page-wrapper";

const SECTIONS = [
  {
    href: "/users",
    icon: Users,
    title: "Users",
    body: "Browse and filter every account on the platform.",
  },
  {
    href: "/groups",
    icon: Shield,
    title: "Groups",
    body: "Permission groups and the admins assigned to them.",
  },
];

export default async function AdminHomePage() {
  const user = await getCurrentUserAction();

  return (
    <PageWrapper
      title={user ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
      description="Pick a section to get started."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} className="group">
            <Card className="hover:border-primary h-full transition-colors">
              <CardHeader className="flex flex-row items-center gap-3">
                <Icon className="text-primary size-6" aria-hidden="true" />
                <h2 className="text-lg font-semibold">{title}</h2>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {body}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
