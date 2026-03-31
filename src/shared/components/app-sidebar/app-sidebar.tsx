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
    <aside className="relative flex h-full min-h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-none border-0 bg-[#182230] px-4 py-6">
      <div className="px-2 pb-4">
        <div className="flex items-center gap-3 text-[15px] font-semibold tracking-tight text-white">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-white/40">
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

      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8eb8da]">
        Apps & Pages
      </div>

      <nav className="flex flex-col gap-0.5">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#0f507b] text-white"
                : "text-[#b7c6d6] hover:bg-white/6 hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className="size-4 shrink-0 text-[#88b2d4] group-hover:text-[#d2e4f4]" />
              {t(item.labelKey)}
            </span>
          </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mx-1 mb-3 rounded-xl border border-white/12 bg-[#223043] px-3 py-3 text-white/90">
          <div className="truncate text-sm font-semibold text-white">
            {currentUser.name}
          </div>
          <div className="mt-0.5 text-xs text-[#bccbdb]">
            {getRoleLabel(currentUser.role)}
          </div>
          <div className="mt-1 truncate text-[11px] text-[#8da2b8]">
            {currentUser.login}
          </div>
        </div>
        <div className="flex flex-col gap-1 px-1 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#b7c6d6] transition-colors hover:bg-white/6 hover:text-white"
          >
            <LogOutIcon className="size-4 text-[#8eb8da]" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}