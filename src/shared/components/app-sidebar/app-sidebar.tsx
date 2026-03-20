"use client";

import {
  ClipboardListIcon,
  ContactRoundIcon,
  CompassIcon,
  LogOutIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/shared/configs/i18/navigation";

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

export function AppSidebar() {
  const t = useTranslations("app.sidebar");

  return (
    <aside className="flex h-full w-[260px] flex-col bg-white px-4 py-6">
      <div className="px-2 pb-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[#566a7f]">
          <div className="grid size-9 place-items-center rounded-xl bg-[#696cff] text-white shadow-sm">
            <span className="text-xs font-bold">PG</span>
          </div>
          {t("brand")}
        </div>
      </div>

      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a1acb8]">
        Apps & Pages
      </div>

      <nav className="flex flex-col gap-1">
        {primaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-[#566a7f] transition-colors hover:bg-white/70 hover:text-[#566a7f]"
          >
            <span className="flex items-center gap-3">
              <item.icon className="size-4 text-[#a1acb8] group-hover:text-[#566a7f]" />
              {t(item.labelKey)}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex flex-col gap-1 px-1 pt-6">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#566a7f] hover:bg-[#f5f5f9]"
          >
            <LogOutIcon className="size-4 text-[#a1acb8]" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}