"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Flame,
  ListChecks,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { Project } from "@/modules/directions/schemas/project.schema";
import { ChartContainer, ChartTooltip } from "@/shared/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

type ProjectDashboardDialogProps = {
  project: Project;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
function getStageLabel(stage: Project["stage"]) {
  switch (stage) {
    case "initialization":
      return "Инициализация";
    case "planning":
      return "Планирование";
    case "execution":
      return "Исполнение";
    case "closure":
      return "Закрытие";
    case "done":
      return "Завершено";
  }
}

function DonutChart({
  value01,
  color,
  centerLabel,
  centerSubLabel,
  size = 120,
}: {
  value01: number;
  color: string;
  centerLabel: string;
  centerSubLabel: string;
  size?: number;
}) {
  const clamped = clamp01(value01);
  const outerRadius = Math.round(size * 0.5);
  const innerRadius = Math.round(size * 0.35);
  const remainingColor = "#e5e7eb";

  const chartConfig = React.useMemo(
    () => ({
      done: { label: "Выполнено", color },
      remaining: { label: "Осталось", color: remainingColor },
    }),
    [color],
  );

  const data = [
    { key: "done", value: clamped },
    { key: "remaining", value: 1 - clamped },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <div style={{ width: size, height: size }} className="relative">
          <ChartContainer
            config={chartConfig}
            style={{ width: size, height: size }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  <Cell fill="var(--color-done)" />
                  <Cell fill="var(--color-remaining)" />
                </Pie>
                <ChartTooltip hideIndicator hideLabel />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-semibold text-[#111827]">
            {centerLabel}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#9ca3af]">
            {centerSubLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-[#374151]">Выполнено</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-neutral-200" />
          <span className="font-semibold text-[#6b7280]">Осталось</span>
        </div>
      </div>
    </div>
  );
}

function StageProgressBar({ percent01 }: { percent01: number }) {
  const segments = [
    { key: "initialization" as const, label: "Иниц." },
    { key: "planning" as const, label: "План" },
    { key: "execution" as const, label: "Исполн." },
    { key: "closure" as const, label: "Закрыт." },
    { key: "done" as const, label: "Готово" },
  ];

  // Разбиваем 0..100 на 5 одинаковых блоков и “наливаем” заполнение по общей
  // величине прогресса.
  const percent = Math.round(clamp01(percent01) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex h-3 gap-1 overflow-hidden rounded-lg bg-neutral-100">
            {segments.map((segment, idx) => {
              const segmentStart = idx * 20;
              const fill = clamp01((percent - segmentStart) / 20);

              return (
                <div key={segment.key} className="relative flex-1">
                  <div className="absolute inset-0 bg-[#eef1ff]" />
                  <div
                    className="absolute inset-y-0 left-0 bg-[#696cff]"
                    style={{ width: `${fill * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-[#9ca3af]">
            Прогресс: <span className="text-[#374151]">{percent}%</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between gap-2 text-[11px] font-semibold text-[#9ca3af]">
        {segments.map((segment) => (
          <span key={segment.key}>{segment.label}</span>
        ))}
      </div>
    </div>
  );
}

type ForecastTaskStatus =
  | "not-started"
  | "started"
  | "in-progress"
  | "completed";
type ForecastTask = {
  id: string;
  title: string;
  status: ForecastTaskStatus;
  planEnd: string; // ISO
};

function makeIsoDate(daysFromBase: number) {
  const base = new Date("2026-02-01T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() + daysFromBase);
  return base.toISOString();
}

function getMilestoneStatesFromPercent(stagePercent: number) {
  const milestoneCount = 8;
  const states: ForecastTaskStatus[] = Array.from({
    length: milestoneCount,
  }).map(() => "not-started");

  const percent = Math.max(0, Math.min(100, stagePercent));
  const unit = 100 / milestoneCount;
  const startedThreshold = 0.33;

  for (let i = 0; i < milestoneCount; i += 1) {
    const start = i * unit;
    const end = (i + 1) * unit;

    if (percent >= end) {
      states[i] = "completed";
      continue;
    }

    if (percent >= start) {
      const segmentProgress = (percent - start) / unit;
      states[i] =
        segmentProgress < startedThreshold ? "started" : "in-progress";
    }
  }

  return states;
}

function buildDeadlineForecastTasks(stagePercent: number): ForecastTask[] {
  const milestoneTitles = [
    "Организационная подготовка и согласования",
    "Геодезия, земляные работы и подготовка основания",
    "Устройство фундамента и подземной части",
    "Возведение каркаса и монтаж перекрытий",
    "Ограждающие конструкции и кровля",
    "Внутренние работы и отделка помещений",
    "Инженерные системы и электромонтаж",
    "Наружные сети, благоустройство и ввод объекта",
  ];

  const milestoneStates = getMilestoneStatesFromPercent(stagePercent);

  return milestoneTitles.map((milestoneTitle, mIdx) => {
    const milestoneState = milestoneStates[mIdx] ?? "not-started";
    const taskStatus: ForecastTaskStatus = milestoneState;

    const planEnd =
      taskStatus === "in-progress"
        ? makeIsoDate(mIdx * 7 + 2)
        : makeIsoDate(mIdx * 7 + 5);

    return {
      id: `forecast-task-${mIdx + 1}`,
      title: milestoneTitle,
      status: taskStatus,
      planEnd,
    };
  });
}

function formatShortDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function computeDaysUntil(targetIso: string, nowIso: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  const target = new Date(targetIso).getTime();
  const now = new Date(nowIso).getTime();
  return Math.ceil((target - now) / dayMs);
}

function computeDaysLate(planEndIso: string, nowIso: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  const planEnd = new Date(planEndIso).getTime();
  const now = new Date(nowIso).getTime();
  return Math.ceil((now - planEnd) / dayMs);
}

export function ProjectDashboardDialog({
  project,
}: ProjectDashboardDialogProps) {
  const locale = useLocale();

  const formatNumber = React.useCallback(
    (value: number) => new Intl.NumberFormat(locale).format(value),
    [locale],
  );
  const formatDateTime = React.useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso)),
    [locale],
  );

  const tasksTotal = Math.max(0, project.tasksTotal);
  const tasksDone = Math.min(tasksTotal, Math.max(0, project.tasksDone));
  const tasksRemaining = Math.max(0, tasksTotal - tasksDone);
  const tasksDone01 = tasksTotal ? tasksDone / tasksTotal : 0;

  const stagePercent01 = clamp01(project.stagePercent / 100);

  const nowIso = project.lastUpdated;
  const forecastTasks = React.useMemo(
    () => buildDeadlineForecastTasks(project.stagePercent),
    [project.stagePercent],
  );

  const soonWindowDays = 7;
  const forecastInWork = forecastTasks.filter(
    (t) => t.status === "in-progress" || t.status === "started",
  );

  const overdueTasks = forecastInWork
    .filter((t) => new Date(t.planEnd).getTime() <= new Date(nowIso).getTime())
    .sort(
      (a, b) => new Date(a.planEnd).getTime() - new Date(b.planEnd).getTime(),
    );

  const soonOverdueTasks = forecastInWork
    .filter((t) => {
      const daysUntil = computeDaysUntil(t.planEnd, nowIso);
      return daysUntil > 0 && daysUntil <= soonWindowDays;
    })
    .sort(
      (a, b) => new Date(a.planEnd).getTime() - new Date(b.planEnd).getTime(),
    );

  const milestoneStates = React.useMemo(
    () => getMilestoneStatesFromPercent(project.stagePercent),
    [project.stagePercent],
  );

  const milestoneCounts = React.useMemo(() => {
    const counts: Record<ForecastTaskStatus, number> = {
      "not-started": 0,
      started: 0,
      "in-progress": 0,
      completed: 0,
    };

    for (const state of milestoneStates) {
      counts[state] += 1;
    }

    return counts;
  }, [milestoneStates]);

  const completionTrendData = React.useMemo(() => {
    const points = 7;
    const start = clamp01(tasksDone01);
    const end = 1;

    return Array.from({ length: points }).map((_, idx) => {
      const t = points <= 1 ? 1 : idx / (points - 1);
      const progress01 = start + (end - start) * t;
      const value = Math.round(progress01 * tasksTotal);

      return {
        label: `Д${idx + 1}`,
        value,
      };
    });
  }, [tasksDone01, tasksTotal]);

  const milestoneStatusChartData = React.useMemo(
    () => [
      { status: "Завершено", value: milestoneCounts.completed },
      { status: "В работе", value: milestoneCounts["in-progress"] },
      { status: "Начато", value: milestoneCounts.started },
      { status: "Не начато", value: milestoneCounts["not-started"] },
    ],
    [milestoneCounts],
  );

  const riskPieData = React.useMemo(
    () => [
      {
        key: "soon",
        label: "Скоро просрочены",
        value: soonOverdueTasks.length,
        color: "#f59e0b",
      },
      {
        key: "overdue",
        label: "Просрочены",
        value: overdueTasks.length,
        color: "#f43f5e",
      },
    ],
    [soonOverdueTasks.length, overdueTasks.length],
  );

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50 hover:text-[#6b7280] transition-colors">
        <BarChart3 className="size-4 text-[#696cff]" />
        Дашборд
        <ArrowRight className="size-4 text-[#9ca3af]" />
      </DialogTrigger>

      <DialogContent className="max-w-6xl space-y-6">
        <DialogHeader className="space-y-4 rounded-2xl border border-neutral-200/70 bg-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold leading-snug text-[#1f2933]">
                Дашборд проекта
              </DialogTitle>
              <p className="text-sm text-[#6b7280]">{project.name}</p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-semibold text-[#696cff]">
              <CheckCircle2 className="size-4" />
              Стадия: {getStageLabel(project.stage)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#9ca3af]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-3 text-[#9ca3af]" />
              Обновлён:{" "}
              <span className="font-medium text-[#4b5563]">
                {formatDateTime(project.lastUpdated)}
              </span>
            </span>
            <span className="hidden h-3 w-px bg-neutral-200 sm:inline-block" />
            <span className="inline-flex items-center gap-2">
              <Users className="size-3 text-[#9ca3af]" />
              Участники:{" "}
              <span className="font-medium text-[#4b5563]">
                {formatNumber(project.participants)}
              </span>
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-[#696cff]" />
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Выполнено
                  </h3>
                </div>
                <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#9ca3af]">
                  {formatNumber(tasksDone)} / {formatNumber(tasksTotal)}
                </div>
              </div>

              <div className="mt-3">
                <DonutChart
                  value01={tasksDone01}
                  color="#696cff"
                  centerLabel={`${Math.round(tasksDone01 * 100)}%`}
                  centerSubLabel="выполнено"
                  size={110}
                />
              </div>

              <div className="mt-2 text-xs text-[#6b7280]">
                Осталось: {formatNumber(tasksRemaining)}
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#696cff]" />
                <h3 className="text-sm font-semibold text-[#111827]">
                  Прогресс стадии
                </h3>
              </div>

              <div className="mt-3">
                <StageProgressBar percent01={stagePercent01} />
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-[#696cff]" />
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Динамика задач
                  </h3>
                </div>
                <div className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-semibold text-[#696cff]">
                  {project.stagePercent}% этапа
                </div>
              </div>

              <div className="mt-3 h-44">
                <ChartContainer
                  config={{
                    done: { label: "Задачи", color: "#696cff" },
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <AreaChart data={completionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        width={40}
                      />
                      <ChartTooltip hideIndicator />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="done"
                        stroke="#696cff"
                        strokeWidth={2}
                        fill="#eef1ff"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#696cff]" />
                <h3 className="text-sm font-semibold text-[#111827]">
                  Статус этапов
                </h3>
              </div>

              <div className="mt-3 h-44">
                <ChartContainer
                  config={{
                    milestones: {
                      label: "Этапы",
                      color: "#696cff",
                    },
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <BarChart data={milestoneStatusChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="status"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <ChartTooltip hideIndicator />
                      <Bar
                        dataKey="value"
                        name="milestones"
                        fill="#696cff"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#696cff]" />
                <h3 className="text-sm font-semibold text-[#111827]">
                  Баланс статусов
                </h3>
              </div>

              <div className="mt-3 h-44">
                <ChartContainer
                  config={{
                    milestones: {
                      label: "Этапы",
                      color: "#696cff",
                    },
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <RadarChart
                      data={milestoneStatusChartData.map((d) => ({
                        status: d.status,
                        count: d.value,
                      }))}
                      outerRadius="80%"
                    >
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="status"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                      />
                      <PolarRadiusAxis />
                      <ChartTooltip hideIndicator />
                      <Radar
                        name="milestones"
                        dataKey="count"
                        stroke="#696cff"
                        fill="#eef1ff"
                        fillOpacity={0.7}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-[#f59e0b]" />
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Риск просрочки
                  </h3>
                </div>
                <div className="text-xs font-semibold text-[#6b7280]">
                  {soonOverdueTasks.length + overdueTasks.length} задач
                </div>
              </div>

              <div className="mt-3 h-44">
                <ChartContainer
                  config={{
                    soon: { label: "Скоро", color: "#f59e0b" },
                    overdue: { label: "Просрочено", color: "#f43f5e" },
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                  >
                    <PieChart>
                      <ChartTooltip hideIndicator />
                      <Pie
                        data={riskPieData}
                        dataKey="value"
                        nameKey="key"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {riskPieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={`var(--color-${entry.key})`}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </section>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200/70 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#111827]">
                Скоро будут просрочены
              </h3>
              <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {soonOverdueTasks.length ? `${soonOverdueTasks.length}` : "0"}
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                Скоро будут просрочены (7 дней)
              </h4>

              {soonOverdueTasks.length ? (
                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {soonOverdueTasks.map((task) => {
                    const daysUntil = computeDaysUntil(task.planEnd, nowIso);
                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-amber-800">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-amber-700/80">
                            План: {formatShortDate(task.planEnd, locale)}
                          </p>
                        </div>
                        <span className="flex-none rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700">
                          осталось: {daysUntil} дн.
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#9ca3af]">
                  Просрочка в ближайшие 7 дней не ожидается
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/70 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#111827]">
                Просроченные задачи
              </h3>
              <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                {overdueTasks.length ? `${overdueTasks.length}` : "0"}
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                Просрочены
              </h4>

              {overdueTasks.length ? (
                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-rose-800">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-rose-700/80">
                          План: {formatShortDate(task.planEnd, locale)}
                        </p>
                      </div>
                      <span className="flex-none rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-rose-700">
                        просрочено: {computeDaysLate(task.planEnd, nowIso)} дн.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#9ca3af]">
                  Нет просроченных задач
                </p>
              )}
            </div>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
