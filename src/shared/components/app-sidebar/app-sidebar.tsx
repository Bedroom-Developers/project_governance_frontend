"use client";

import {
  ClipboardListIcon,
  ContactRoundIcon,
  CompassIcon,
  LogOutIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Link, usePathname } from "@/shared/configs/i18/navigation";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import { canViewUsers, getRoleLabel } from "@/shared/lib/app-users";
import { clearClientAuthCookie } from "@/shared/lib/auth";
import { cn } from "@/shared/lib/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const primaryItems: NavItem[] = [
  { href: "/directions", labelKey: "directions", icon: CompassIcon },
  { href: "/users", labelKey: "users", icon: ContactRoundIcon },
  {
    href: "/protocol-orders",
    labelKey: "protocolOrders",
    icon: ClipboardListIcon,
  },
];

type AppSidebarProps = {
  currentUser: WorkspaceUser;
};

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const t = useTranslations("app.sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const navigationItems = canViewUsers(currentUser.role)
    ? primaryItems
    : primaryItems.filter((item) => item.href !== "/users");

  const handleLogout = () => {
    clearClientAuthCookie();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <aside className="relative flex h-full min-h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-none border-0 bg-[#080a12] px-4 py-6">
      <img
        src="/shapkanavigornaments.png"
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      <div className="relative z-10 px-2 pb-4">
        <div className="flex items-center gap-3 text-[15px] font-semibold tracking-tight text-white">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-[#00BFFF]/20 ring-1 ring-[#00BFFF]/25">
            <img
              src="/logo/logoabayoblysy.jpg"
              alt=""
              className="size-full object-contain"
              width={44}
              height={44}
            />
          </div>
          <span className="truncate">{t("brand")}</span>
        </div>
      </div>

      <div className="relative z-10 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00BFFF]/70">
        Apps & Pages
      </div>

      <nav className="relative z-10 flex flex-col gap-0.5">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#00BFFF]/15 text-[#00BFFF]"
                : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className="size-4 shrink-0 text-[#00BFFF]/80 group-hover:text-[#00BFFF]" />
              {t(item.labelKey)}
            </span>
          </Link>
          );
        })}
      </nav>

      <div className="relative z-10 mt-auto">
        <div className="mx-1 mb-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white/85 backdrop-blur">
          <div className="truncate text-sm font-semibold text-white">
            {currentUser.name}
          </div>
          <div className="mt-0.5 text-xs text-[#94a3b8]">
            {getRoleLabel(currentUser.role)}
          </div>
          <div className="mt-1 truncate text-[11px] text-[#64748b]">
            {currentUser.login}
          </div>
        </div>
        <div className="flex flex-col gap-1 px-1 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOutIcon className="size-4 text-[#00BFFF]/70" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}