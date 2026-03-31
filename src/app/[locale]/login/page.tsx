import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/modules/auth";
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
    <div className="min-h-[100dvh] bg-[#f3f6fa]">
      <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
        <aside className="hidden border-r border-[#dbe5ef] bg-[#eff4f9] md:block">
          <div className="flex h-full items-center justify-center p-10">
            <div className="max-w-md rounded-xl border border-[#dbe5ef] bg-white p-7 text-[#1f2f40]">
              <h2 className="text-xl font-semibold">Abai Digital Projects</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f6f81]">
                Единая рабочая среда для управления направлениями, задачами и отчётностью.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-6 py-12">
          <div className="relative w-full max-w-sm">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}
