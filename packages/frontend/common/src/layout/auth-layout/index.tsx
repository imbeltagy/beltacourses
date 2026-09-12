import Image from "next/image";

import { Logo } from "../../components/logo";

export function AuthLayout({
  children,
  image,
}: {
  children: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="flex min-h-[100svh] w-full">
      <div className="flex w-full grow-1 flex-col self-stretch px-4 py-6 lg:px-8">
        <Logo className="w-full max-w-[300px] shrink-0" />
        <div className="flex grow-1 items-center justify-center">
          {children}
        </div>
      </div>

      <div className="bg-primary/15 flex w-full grow-1 items-center justify-center p-2 max-md:hidden">
        <Image
          width={500}
          height={500}
          src={image ?? "/assets/images/auth/login.svg"}
          alt="Auth Background"
          className="mt-[150px] max-h-full max-w-full object-cover"
        />
      </div>
    </div>
  );
}
