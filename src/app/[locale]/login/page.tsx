import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/modules/auth";
import { Globe } from "@/shared/components/magicui/globe/globe";
import { AUTH_COOKIE_NAME, getAuthenticatedUserById } from "@/shared/lib/auth";

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
    <div className="min-h-[100dvh] bg-neutral-950">
      <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-neutral-100 md:block">
          <div className="absolute inset-0">
            <div className="absolute -left-40 -top-32 size-[520px] rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-56 -right-56 size-[720px] rounded-full bg-neutral-200/70 blur-3xl" />
          </div>

          <div className="relative flex h-full items-center justify-center p-10">
            <Globe className="opacity-95" />
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-6 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_-20%,rgba(255,255,255,0.10),transparent_40%),radial-gradient(800px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%)]" />
          <div className="relative w-full max-w-sm">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
