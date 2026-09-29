import { Card, CardHeader } from "@repo/frontend/ui";
import { LoginForm } from "./components/login-form";

/**
 * The page itself stays a server component — only the form below it is
 * `"use client"`. `apps/*` re-export this as the route's `page.tsx`.
 */
export default function LoginPage() {
  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">Welcome back</h1>
        <p className="text-muted-foreground">Please enter your details</p>
      </CardHeader>

      <LoginForm />
    </Card>
  );
}
