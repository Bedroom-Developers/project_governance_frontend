"use client";

import { CalendarClock, RotateCcw, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  getProtocolOrdersAttentionStats,
  getProtocolTasksCompletionStats,
  PROTOCOL_ORDERS_CHANGED_EVENT,
} from "@/shared/lib/protocol-orders-storage-reader";

type SidebarProtocolTasksSummaryProps = {
  currentUser: WorkspaceUser;
};

export function SidebarProtocolTasksSummary({ currentUser }: SidebarProtocolTasksSummaryProps) {
  const t = useTranslations("app");
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [attention, setAttention] = useState({ extended: 0, returned: 0 });

  useEffect(() => {
    const sync = () => {
      setStats(getProtocolTasksCompletionStats(currentUser));
      setAttention(getProtocolOrdersAttentionStats(currentUser));
    };
    sync();
    window.addEventListener(PROTOCOL_ORDERS_CHANGED_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(PROTOCOL_ORDERS_CHANGED_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, [currentUser]);

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-[#f0f2f8] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/25">
        <div className="text-[11px] font-medium leading-tight text-[#64748b]">
          {t("sidebar.tasksCompletedLabel")}
        </div>
        <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-[#0f172a]">
          {stats.completed}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Target className="size-3.5 shrink-0" strokeWidth={2.5} />
          <span>{t("sidebar.tasksCompletedOf", { total: stats.total })}</span>
        </div>
      </div>

      {attention.extended > 0 || attention.returned > 0 ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-left ring-1 ring-sky-100/80">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-800/90">
            {t("sidebar.attentionLabel")}
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] font-semibold text-[#0f172a]">
            {attention.extended > 0 ? (
              <div className="flex items-center gap-1.5 text-sky-900">
                <CalendarClock className="size-3.5 shrink-0 text-sky-600" aria-hidden />
                <span>{t("sidebar.attentionExtendedCount", { count: attention.extended })}</span>
              </div>
            ) : null}
            {attention.returned > 0 ? (
              <div className="flex items-center gap-1.5 text-orange-950">
                <RotateCcw className="size-3.5 shrink-0 text-orange-600" aria-hidden />
                <span>{t("sidebar.attentionReturnedCount", { count: attention.returned })}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
