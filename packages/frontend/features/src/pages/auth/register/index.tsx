import { Card, CardHeader } from "@repo/frontend/ui";
import { RegisterForm } from "./components/register-form";

export default function RegisterPage() {
  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">Create Account</h1>
        <p className="text-muted-foreground">
          Please complete your registration
        </p>
      </CardHeader>

      <RegisterForm />
    </Card>
  );
}
