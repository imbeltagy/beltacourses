import Image from "next/image";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@repo/frontend/components/locale-switcher";
import { Logo } from "@repo/frontend/components/logo";
import { imgUrl } from "@repo/frontend/utils/img-url";

export function AuthLayout({
  children,
  image,
}: {
  children: React.ReactNode;
  image?: string;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[100svh] w-full">
      <div className="flex w-full grow-1 flex-col self-stretch px-4 py-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <Logo className="w-full max-w-[300px] shrink-0" />
          <LocaleSwitcher />
        </div>
        <div className="flex grow-1 items-center justify-center">
          {children}
        </div>
      </div>

      <div className="bg-primary/15 flex w-full grow-1 items-center justify-center p-2 max-md:hidden">
        <Image
          width={500}
          height={500}
          src={image ?? imgUrl("/assets/images/auth/login.svg")}
          alt={t("authImageAlt")}
          className="mt-[150px] max-h-full max-w-full object-cover"
        />
      </div>
    </div>
  );
}
