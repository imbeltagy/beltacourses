import { Card, CardHeader } from "@repo/frontend/ui";
import { ModeratorLoginForm } from "./components/moderator-login-form";

export default function ModeratorLoginPage() {
  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">Admin panel</h1>
        <p className="text-muted-foreground">
          Staff sign-in. Client accounts cannot log in here.
        </p>
      </CardHeader>

      <ModeratorLoginForm />
    </Card>
  );
}
