import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MoonStar } from "lucide-react";
import type { ReactNode } from "react";

import { AppSidebar } from "@/shared/components/app-sidebar/app-sidebar";
import { LanguageSwitcher } from "@/shared/components/language-switcher/language-switcher";
import { OrnamentBackground, OrnamentCorner } from "@/shared/components/ornament";
import { getRoleLabel } from "@/shared/lib/app-users";
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

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-[#eef5fc] via-[#f0f7fc] to-[#e8f4fc]">
      <OrnamentBackground className="text-[#00BFFF]" />

      <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden">
        <div className="hidden md:block h-[100dvh] min-h-[100dvh] shrink-0 overflow-hidden rounded-none bg-[#080a12]">
          <AppSidebar currentUser={currentUser} />
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <OrnamentCorner position="top-right" className="h-24 w-24 opacity-[0.07] animate-float" />

          <div className="relative w-full px-4 py-5 pb-10 sm:px-6 sm:pb-12 md:px-8 lg:px-10 xl:px-12">
            <header className="mb-5 flex items-center justify-end gap-1 rounded-2xl bg-white/95 px-4 py-2.5 shadow-[0_2px_12px_rgba(0,175,255,0.06)] backdrop-blur-md animate-fade-in-up transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,175,255,0.12)]">
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-xl text-[#566a7f] transition-all duration-300 hover:scale-110 hover:bg-[#00BFFF]/10 hover:text-[#0099cc]"
                  aria-label="Theme"
                >
                  <MoonStar className="size-4" />
                </button>
                <div className="ml-2 flex items-center gap-2 rounded-2xl border border-[#00BFFF]/10 bg-[#f8fcff] px-2.5 py-1.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00BFFF]/15 to-[#0099cc]/15 text-xs font-semibold text-[#0099cc] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(0,175,255,0.3)]">
                    {getNameInitials(currentUser.name)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="max-w-[180px] truncate text-xs font-semibold text-[#1f2933]">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-[#6b7280]">
                      {getRoleLabel(currentUser.role)}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="w-full animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
