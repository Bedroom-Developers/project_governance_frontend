import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/shared/components/app-sidebar/app-sidebar";
import { LanguageSwitcher } from "@/shared/components/language-switcher/language-switcher";
import { canViewUsers, getRoleLabel } from "@/shared/lib/app-users";
import { AUTH_COOKIE_NAME, getAuthenticatedUserById } from "@/shared/lib/auth";

function getNameInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const currentUser = getAuthenticatedUserById(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
  );

  if (!currentUser) {
    redirect(`/${locale}/login`);
  }

  const mobileNavItems = [
    { href: "/directions", label: "Направления" },
    ...(canViewUsers(currentUser.role) ? [{ href: "/users", label: "Пользователи" }] : []),
    { href: "/protocol-orders", label: "Протокольные поручение" },
  ];

  return (
    <div className="relative min-h-[100dvh] bg-[#f3f6fa]">
      <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden">
        <div className="hidden h-[100dvh] min-h-[100dvh] shrink-0 overflow-hidden rounded-none border-r border-[#dbe5ef] bg-[#182230] md:block">
          <AppSidebar currentUser={currentUser} />
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="relative w-full px-4 py-5 pb-10 sm:px-6 sm:pb-12 md:px-8 lg:px-10 xl:px-12">
            <nav className="mb-4 flex flex-wrap gap-2 md:hidden">
              {mobileNavItems.map((item) => (
                <a
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="rounded-md border border-[#dbe5ef] bg-white px-3 py-2 text-xs font-semibold text-[#3f556c] transition hover:bg-[#f5f8fb]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <header className="mb-5 flex items-center justify-end gap-1 rounded-xl border border-[#dbe5ef] bg-white px-4 py-2.5">
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <div className="ml-2 flex items-center gap-2 rounded-xl border border-[#dbe5ef] bg-[#f8fafc] px-2.5 py-1.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#e6f0f8] text-xs font-semibold text-[#0f507b]">
                    {getNameInitials(currentUser.name)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="max-w-[180px] truncate text-xs font-semibold text-[#1f2933]">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-[#5b6877]">
                      {getRoleLabel(currentUser.role)}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="w-full">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
