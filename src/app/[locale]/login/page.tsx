import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/modules/auth";
import { AUTH_COOKIE_NAME, getAuthenticatedUserById } from "@/shared/lib/auth";
import { Globe } from "@/shared/components/magicui/globe/globe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("pageTitle") };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const currentUser = getAuthenticatedUserById(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
  );

  if (currentUser) {
    redirect(`/${locale}/directions`);
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0c]">
      <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
        <aside
          className={[
            "relative order-2 flex min-h-[min(42vh,380px)] items-center justify-center",
            "bg-gradient-to-br from-[#f6f7f9] via-[#eceff3] to-[#e4e8ee]",
            "px-8 py-10 lg:order-1 lg:min-h-[100dvh] lg:px-12",
          ].join(" ")}
        >
          <div className="relative z-10 w-full max-w-[min(88vw,460px)]">
            <Globe variant="login" />
          </div>
        </aside>

        <main className="order-1 flex min-h-[min(58vh,100dvh)] items-center justify-center bg-[#0a0a0c] px-6 py-12 lg:order-2 lg:min-h-[100dvh] lg:px-10">
          <div className="relative w-full max-w-[380px]">
            <LoginForm variant="dark" />
          </div>
        </main>
      </div>
    </div>
  );
}
