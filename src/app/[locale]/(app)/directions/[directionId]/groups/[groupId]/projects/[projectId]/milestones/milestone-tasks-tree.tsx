"use client";

import { CheckCircle2, Clock3, Loader2, StopCircle } from "lucide-react";
import { useLocale } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

import type { TaskNode } from "./milestones-client";

type MilestoneTasksTreeProps = {
  nodes: TaskNode[];
  selected: { kind: TaskNode["kind"]; id: string } | null;
  onSelect: (node: TaskNode) => void;
  computeOverdueBadge: (
    task: TaskNode,
  ) => { label: string; tooltip: string } | null;
};

function statusLabel(state: TaskNode["status"]) {
  if (state === "completed") return "Завершено";
  if (state === "in-progress") return "В работе";
  if (state === "started") return "Начат";
  return "Не начат";
}

function statusPillClass(state: TaskNode["status"]) {
  if (state === "completed")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "in-progress")
    return "border-[#696cff] bg-[#eef1ff] text-[#696cff]";
  if (state === "started") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

function statusIcon(state: TaskNode["status"]) {
  if (state === "completed") return <CheckCircle2 className="size-3.5" />;
  if (state === "in-progress")
    return <Loader2 className="size-3.5 animate-spin" />;
  if (state === "started") return <Clock3 className="size-3.5" />;
  return <StopCircle className="size-3.5" />;
}

function formatShortDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

export function MilestoneTasksTree({
  nodes,
  selected,
  onSelect,
  computeOverdueBadge,
}: MilestoneTasksTreeProps) {
  const locale = useLocale();

  if (!nodes.length) {
    return (
      <div className="rounded-lg border border-neutral-200/70 bg-white p-4 text-sm text-neutral-500">
        Нет дочерних задач
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TaskTreeNode
          key={node.id}
          node={node}
          locale={locale}
          selected={selected}
          onSelect={onSelect}
          computeOverdueBadge={computeOverdueBadge}
        />
      ))}
    </div>
  );
}

function TaskTreeNode({
  node,
  locale,
  selected,
  onSelect,
  computeOverdueBadge,
}: {
  node: TaskNode;
  locale: string;
  selected: { kind: TaskNode["kind"]; id: string } | null;
  onSelect: (node: TaskNode) => void;
  computeOverdueBadge: (
    task: TaskNode,
  ) => { label: string; tooltip: string } | null;
}) {
  const overdue = computeOverdueBadge(node);
  const isSelected = selected?.kind === node.kind && selected?.id === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={cn(
          "group w-full rounded-lg border bg-white p-3 text-left transition-colors",
          isSelected
            ? "border-[#696cff]/60 shadow-[0_0_0_3px_rgba(105,108,255,0.12)]"
            : "border-neutral-200/70 hover:border-neutral-300",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#1f2933]">
              {node.title}
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              План: {formatShortDate(node.planStart, locale)} —{" "}
              {formatShortDate(node.planEnd, locale)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                statusPillClass(node.status),
              )}
            >
              {statusIcon(node.status)}
              {statusLabel(node.status)}
            </span>

            {overdue ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold leading-tight text-red-700">
                      {overdue.label}
                    </span>
                  }
                />
                <TooltipPositioner>
                  <TooltipContent side="top">{overdue.tooltip}</TooltipContent>
                </TooltipPositioner>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </button>

      {node.children.length ? (
        <div className="mt-2 ml-4 border-l border-neutral-200 pl-4">
          <div className="mt-2 space-y-2">
            {node.children.map((child) => (
              <TaskTreeNode
                key={child.id}
                node={child}
                locale={locale}
                selected={selected}
                onSelect={onSelect}
                computeOverdueBadge={computeOverdueBadge}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
