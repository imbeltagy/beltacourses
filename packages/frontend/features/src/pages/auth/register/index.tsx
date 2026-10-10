import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@repo/frontend/ui";
import { RegisterForm } from "./components/register-form";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>

      <RegisterForm />
    </Card>
  );
}
