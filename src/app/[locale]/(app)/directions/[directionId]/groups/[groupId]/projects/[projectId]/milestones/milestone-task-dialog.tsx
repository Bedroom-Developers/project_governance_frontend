"use client";

import { useLocale } from "next-intl";
import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { MilestoneTasksTree } from "./milestone-tasks-tree";
import type { TaskNode } from "./milestones-client";

type MilestoneTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: TaskNode | null;
  activeTab: "информация" | "задачи";
  onActiveTabChange: (tab: "информация" | "задачи") => void;
  onSelect: (node: TaskNode) => void;
  computeOverdueBadge: (
    task: TaskNode,
  ) => { label: string; tooltip: string } | null;
};

function statusToStageLabel(state: TaskNode["status"]) {
  if (state === "completed") return "завершилось";
  if (state === "not-started") return "не начат";
  return "исполняется";
}

function formatIsoDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function formatIsoDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function MilestoneTaskDialog({
  open,
  onOpenChange,
  selected,
  activeTab,
  onActiveTabChange,
  onSelect,
  computeOverdueBadge,
}: MilestoneTaskDialogProps) {
  const locale = useLocale();

  const rootChildren = React.useMemo(() => {
    if (!selected) return [];
    return selected.children ?? [];
  }, [selected]);

  if (!selected) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-6xl space-y-6 rounded-2xl p-0 overflow-hidden"
      >
        <div className="bg-white p-6">
          <DialogHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold leading-snug text-[#1f2933]">
                  {selected.title}
                </DialogTitle>
                <p className="text-sm text-[#6b7280]">
                  Стадия:{" "}
                  <span className="font-semibold text-[#374151]">
                    {statusToStageLabel(selected.status)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-semibold text-[#696cff]">
                  {selected.kind === "milestone" ? "Веха" : "Задача"}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              onActiveTabChange(v as "информация" | "задачи")
            }
            className="gap-0 mt-5"
          >
            <div className="border-b border-neutral-100 px-4 py-3">
              <TabsList className="h-9 w-full justify-start rounded-lg bg-neutral-50">
                <TabsTrigger
                  value="информация"
                  className="flex-none px-3 flex items-center gap-2"
                >
                  Информация
                </TabsTrigger>
                <TabsTrigger
                  value="задачи"
                  className="flex-none px-3 flex items-center gap-2"
                >
                  Задачи
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-4 py-4">
              <TabsContent value="информация">
                <div className="rounded-xl border border-neutral-200/70 bg-white p-4 text-sm text-[#4b5563]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                        Последняя активность
                      </div>
                      <div className="mt-1 font-medium text-[#374151]">
                        {selected.lastActivity
                          ? formatIsoDateTime(selected.lastActivity, locale)
                          : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                        Начало / Завершение (факт)
                      </div>
                      <div className="mt-1 font-medium text-[#374151]">
                        {selected.factStart
                          ? formatIsoDate(selected.factStart, locale)
                          : "—"}{" "}
                        →{" "}
                        {selected.factEnd
                          ? formatIsoDate(selected.factEnd, locale)
                          : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                        Начало / Завершение (Базовый план)
                      </div>
                      <div className="mt-1 font-medium text-[#374151]">
                        {formatIsoDate(selected.planStart, locale)} →{" "}
                        {formatIsoDate(selected.planEnd, locale)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                        Постановщик
                      </div>
                      <div className="mt-1 font-medium text-[#374151]">
                        {selected.assigner}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                        Исполнитель
                      </div>
                      <div className="mt-1 font-medium text-[#374151]">
                        {selected.executor}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                      Задачи
                    </div>
                    <ul className="mt-2 space-y-1">
                      {(selected.children ?? []).slice(0, 6).map((c) => (
                        <li key={c.id} className="text-[#374151] font-medium">
                          {c.title}
                        </li>
                      ))}
                      {selected.children.length > 6 ? (
                        <li className="text-sm text-[#9ca3af]">
                          Ещё {selected.children.length - 6} задач
                        </li>
                      ) : null}
                      {selected.children.length === 0 ? (
                        <li className="text-sm text-[#9ca3af]">—</li>
                      ) : null}
                    </ul>
                  </div>

                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                      История изменений
                    </div>
                    {selected.history.length === 0 ? (
                      <p className="mt-2 text-sm text-neutral-500">
                        Нет записей
                      </p>
                    ) : (
                      <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-100">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                            <tr>
                              <th className="px-3 py-2">Дата</th>
                              <th className="px-3 py-2">Автор</th>
                              <th className="px-3 py-2">Где изменилось</th>
                              <th className="px-3 py-2">Изменение</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selected.history.map((h) => (
                              <tr
                                key={`${h.date}-${h.field}-${h.oldValue}`}
                                className="border-b border-neutral-50 last:border-0"
                              >
                                <td className="whitespace-nowrap px-3 py-2 text-[#374151]">
                                  {formatIsoDate(h.date, locale)}
                                </td>
                                <td className="px-3 py-2 text-[#374151]">
                                  {h.author}
                                </td>
                                <td className="px-3 py-2 text-[#374151]">
                                  {h.field}
                                </td>
                                <td className="px-3 py-2 text-[#374151]">
                                  <span className="text-red-600 line-through decoration-red-400/60">
                                    {h.oldValue}
                                  </span>
                                  <span className="mx-2 text-neutral-400">
                                    →
                                  </span>
                                  <span className="font-medium text-emerald-700">
                                    {h.newValue}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                      Комментарии
                    </div>
                    {selected.comments.length === 0 ? (
                      <p className="mt-2 text-sm text-neutral-500">
                        Комментариев пока нет
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {selected.comments.map((c) => (
                          <li
                            key={`${c.date}-${c.author}`}
                            className="rounded-lg border border-neutral-100 bg-white p-3 shadow-[0_1px_0_rgba(34,48,62,0.04)]"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ca3af]">
                              <span className="font-semibold text-[#566a7f]">
                                {c.author}
                              </span>
                              <span>·</span>
                              <span>{formatIsoDate(c.date, locale)}</span>
                            </div>
                            <p className="mt-1.5 text-sm text-[#374151]">
                              {c.text}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="задачи">
                <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#111827]">
                        Дочерние задачи
                      </span>
                    </div>
                    <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#4b5563]">
                      {rootChildren.length} задач
                    </div>
                  </div>

                  <MilestoneTasksTree
                    nodes={rootChildren}
                    selected={
                      selected ? { kind: selected.kind, id: selected.id } : null
                    }
                    onSelect={(next) => {
                      onSelect(next);
                      onActiveTabChange("задачи");
                    }}
                    computeOverdueBadge={computeOverdueBadge}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
