"use client";

import { useLocale } from "next-intl";
import * as React from "react";

import type { Project } from "@/modules/directions/schemas/project.schema";

import { cn } from "@/shared/lib/utils";
import { MilestoneTaskDialog } from "./milestone-task-dialog";

type StageState = "not-started" | "started" | "in-progress" | "completed";

type StageLabel = "не начат" | "исполняется" | "завершилось";

type NodeType = "milestone" | "task";

export type TaskHistoryEntry = {
  date: string;
  author: string;
  field: string;
  oldValue: string;
  newValue: string;
};

export type TaskComment = {
  author: string;
  date: string;
  text: string;
};

export type TaskNode = {
  kind: NodeType;
  id: string;
  title: string;
  status: StageState;
  lastActivity: string | null;
  factStart: string | null;
  factEnd: string | null;
  planStart: string;
  planEnd: string;
  assigner: string;
  executor: string;
  history: TaskHistoryEntry[];
  comments: TaskComment[];
  children: TaskNode[];
};

type MilestonesClientProps = {
  directionId: string;
  groupId: string;
  projectId: string;
  project: Project;
};

type SelectedNode = {
  kind: NodeType;
  id: string;
};

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function formatDelayDuration(daysLate: number): string {
  if (daysLate < 1) return "";
  if (daysLate < 30) return pluralRu(daysLate, "день", "дня", "дней");

  if (daysLate < 365) {
    const months = Math.min(11, Math.max(1, Math.round(daysLate / 30)));
    return pluralRu(months, "месяц", "месяца", "месяцев");
  }

  const years = Math.floor(daysLate / 365);
  const rem = daysLate - years * 365;
  const months =
    rem >= 25 ? Math.min(11, Math.max(1, Math.round(rem / 30))) : 0;

  if (months > 0 && years > 0) {
    return `${pluralRu(years, "год", "года", "лет")} ${pluralRu(
      months,
      "месяц",
      "месяца",
      "месяцев",
    )}`;
  }

  return pluralRu(years, "год", "года", "лет");
}

function stateToStageLabel(state: StageState): StageLabel {
  if (state === "completed") return "завершилось";
  if (state === "not-started") return "не начат";
  return "исполняется";
}

function stageBadgeClass(label: StageLabel) {
  if (label === "завершилось")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (label === "не начат")
    return "border-neutral-200 bg-neutral-50 text-neutral-600";
  return "border-[#696cff] bg-[#eef1ff] text-[#696cff]";
}

function getMilestoneStatesFromPercent(stagePercent: number): StageState[] {
  const milestoneCount = 8;
  const states: StageState[] = Array.from({ length: milestoneCount }).map(
    () => "not-started",
  );

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

function makeIsoDate(daysFromBase: number) {
  const base = new Date("2026-02-01T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() + daysFromBase);
  return base.toISOString();
}

function computeDelayBadgeForOverdueTask(task: TaskNode, nowIso: string) {
  const now = new Date(nowIso);
  const planEnd = task.planEnd ? new Date(task.planEnd) : null;
  if (!planEnd) return null;

  let lateDays = 0;
  if (task.status === "completed" && task.factEnd) {
    const factEnd = new Date(task.factEnd);
    lateDays = Math.max(
      0,
      Math.ceil((factEnd.getTime() - planEnd.getTime()) / 86400000),
    );
  }

  if (task.status === "in-progress") {
    if (planEnd.getTime() >= now.getTime()) return null;
    lateDays = Math.max(
      0,
      Math.ceil((now.getTime() - planEnd.getTime()) / 86400000),
    );
  }

  if (lateDays <= 0) return null;

  return {
    label: `-${formatDelayDuration(lateDays)}`,
    tooltip: `Просрочено на ${formatDelayDuration(lateDays)}`,
  };
}

const MILESTONES_TITLES = [
  "Организационная подготовка и согласования",
  "Геодезия, земляные работы и подготовка основания",
  "Устройство фундамента и подземной части",
  "Возведение каркаса и монтаж перекрытий",
  "Ограждающие конструкции и кровля",
  "Внутренние работы и отделка помещений",
  "Инженерные системы и электромонтаж",
  "Наружные сети, благоустройство и ввод объекта",
];

const STAGE_TASK_TITLES: Array<readonly [string, string, string]> = [
  [
    "Подготовка площадки и старт работ",
    "Документация ПОС/ППР и закупочный план",
    "Согласование графика с подрядчиками",
  ],
  [
    "Геодезическая разбивка и контроль отметок",
    "Котлован, траншеи и вывоз грунта",
    "Отсыпка, обратная засыпка и уплотнение",
  ],
  [
    "Основание и армирование фундаментных конструкций",
    "Бетонирование плит и ростверков",
    "Гидроизоляция и антикоррозионная защита",
  ],
  [
    "Монтаж несущего каркаса",
    "Устройство перекрытий и узлов примыкания",
    "Геометрический контроль и приемка каркаса",
  ],
  [
    "Монтаж ограждающих конструкций",
    "Устройство кровли и водосточных систем",
    "Оконные блоки и герметизация узлов",
  ],
  [
    "СМР в спортивном зале и раздевалках",
    "Отделка помещений: штукатурка и покраска",
    "Полы, подвесные потолки и внутренние перегородки",
  ],
  [
    "Электроснабжение и силовые сети",
    "ОВ/ВК: отопление, вентиляция и водоснабжение",
    "Слаботочные системы: связь, СКУД и видеонаблюдение",
  ],
  [
    "Наружные сети: водопровод, канализация, ливневка",
    "Благоустройство территории и спортивные площадки",
    "Пусконаладка, комплексные испытания и ввод в эксплуатацию",
  ],
];

const STAGE_SUBTASK_TITLES: Array<string | null> = [
  "Разбивка работ по фазам: въезд техники, ограждение и временные сети",
  null,
  "Монтаж закладных деталей для крепления каркаса",
  null,
  "Утепление и пароизоляция кровельного пирога",
  null,
  "Прокладка кабельных линий, маркировка и измерения",
  null,
];

function buildTasksTree(
  project: Project,
  milestoneStateList: StageState[],
): TaskNode[] {
  const assigner = project.ownerName;
  const executorA = "Асхат Сатыбалдин";
  const executorB = "Бауржан Шакабасов";
  const executorC = "Ерлан Нурланов";

  const nowIso = new Date().toISOString();

  // Демо-генерация: по 3 задачи на этап, у части есть подзадачи.
  return MILESTONES_TITLES.map((milestoneTitle, mIdx) => {
    const milestoneState = milestoneStateList[mIdx] ?? "not-started";
    const milestoneId = `milestone-${mIdx + 1}`;
    const stageSubtaskTitle = STAGE_SUBTASK_TITLES[mIdx];
    const stageTasks: TaskNode[] = [
      {
        kind: "task",
        id: `task-${milestoneId}-1`,
        title: STAGE_TASK_TITLES[mIdx]?.[0] ?? milestoneTitle,
        status:
          milestoneState === "completed"
            ? "completed"
            : milestoneState === "in-progress"
              ? "in-progress"
              : milestoneState === "started"
                ? "started"
                : "not-started",
        lastActivity: milestoneState === "not-started" ? null : nowIso,
        factStart:
          milestoneState === "completed" ? makeIsoDate(mIdx * 7 + 2) : null,
        factEnd:
          milestoneState === "completed"
            ? makeIsoDate(mIdx * 7 + 5 + (mIdx % 2 === 0 ? 7 : 0))
            : null,
        planStart: makeIsoDate(mIdx * 7 + 1),
        planEnd:
          milestoneState === "in-progress"
            ? makeIsoDate(mIdx * 7 + 2)
            : makeIsoDate(mIdx * 7 + 5),
        assigner,
        executor:
          mIdx % 3 === 0 ? executorA : mIdx % 3 === 1 ? executorB : executorC,
        history:
          milestoneState === "not-started"
            ? []
            : [
                {
                  date: makeIsoDate(mIdx * 7 + 3),
                  author: assigner,
                  field: "Стадия",
                  oldValue: "новая",
                  newValue:
                    milestoneState === "completed"
                      ? "завершилось"
                      : "исполняется",
                },
              ],
        comments:
          milestoneState === "not-started"
            ? []
            : [
                {
                  author: executorA,
                  date: makeIsoDate(mIdx * 7 + 4),
                  text: "Работы выполняются по графику.",
                },
              ],
        children: stageSubtaskTitle
          ? [
              {
                kind: "task",
                id: `task-${milestoneId}-1-1`,
                title: stageSubtaskTitle,
                status:
                  milestoneState === "completed" ? "completed" : "in-progress",
                lastActivity: nowIso,
                factStart:
                  milestoneState === "completed"
                    ? makeIsoDate(mIdx * 7 + 2)
                    : null,
                factEnd:
                  milestoneState === "completed"
                    ? makeIsoDate(mIdx * 7 + 5 + 10)
                    : null,
                planStart: makeIsoDate(mIdx * 7 + 1),
                planEnd:
                  milestoneState === "in-progress"
                    ? makeIsoDate(mIdx * 7 + 2)
                    : makeIsoDate(mIdx * 7 + 4),
                assigner,
                executor: executorB,
                history:
                  milestoneState === "completed"
                    ? [
                        {
                          date: makeIsoDate(mIdx * 7 + 8),
                          author: executorB,
                          field: "Прогресс",
                          oldValue: "45%",
                          newValue: "100%",
                        },
                      ]
                    : [],
                comments: [],
                children: [],
              },
            ]
          : [],
      },
      {
        kind: "task",
        id: `task-${milestoneId}-2`,
        title: STAGE_TASK_TITLES[mIdx]?.[1] ?? milestoneTitle,
        status:
          milestoneState === "completed"
            ? "completed"
            : milestoneState === "in-progress"
              ? "in-progress"
              : milestoneState === "started"
                ? "started"
                : "not-started",
        lastActivity: milestoneState === "not-started" ? null : nowIso,
        factStart:
          milestoneState === "completed" ? makeIsoDate(mIdx * 7 + 3) : null,
        factEnd:
          milestoneState === "completed" ? makeIsoDate(mIdx * 7 + 7) : null,
        planStart: makeIsoDate(mIdx * 7 + 2),
        planEnd: makeIsoDate(mIdx * 7 + 6),
        assigner,
        executor:
          mIdx % 3 === 0 ? executorB : mIdx % 3 === 1 ? executorC : executorA,
        history:
          milestoneState === "not-started"
            ? []
            : [
                {
                  date: makeIsoDate(mIdx * 7 + 4),
                  author: assigner,
                  field: "Стадия",
                  oldValue: "новая",
                  newValue:
                    milestoneState === "completed"
                      ? "завершилось"
                      : "исполняется",
                },
              ],
        comments:
          milestoneState === "not-started"
            ? []
            : [
                {
                  author: executorB,
                  date: makeIsoDate(mIdx * 7 + 5),
                  text: "Приняты меры по соблюдению сроков.",
                },
              ],
        children: [],
      },
      {
        kind: "task",
        id: `task-${milestoneId}-3`,
        title: STAGE_TASK_TITLES[mIdx]?.[2] ?? milestoneTitle,
        status:
          milestoneState === "completed"
            ? "completed"
            : milestoneState === "in-progress"
              ? "in-progress"
              : milestoneState === "started"
                ? "started"
                : "not-started",
        lastActivity: milestoneState === "not-started" ? null : nowIso,
        factStart:
          milestoneState === "completed" ? makeIsoDate(mIdx * 7 + 4) : null,
        factEnd:
          milestoneState === "completed"
            ? makeIsoDate(mIdx * 7 + 7 + (mIdx === 6 ? 40 : 0))
            : null,
        planStart: makeIsoDate(mIdx * 7 + 3),
        planEnd: makeIsoDate(mIdx * 7 + 6),
        assigner,
        executor:
          mIdx % 3 === 0 ? executorC : mIdx % 3 === 1 ? executorA : executorB,
        history: [],
        comments: [],
        children: [],
      },
    ];

    return {
      kind: "milestone",
      id: milestoneId,
      title: milestoneTitle,
      status: milestoneState,
      lastActivity: milestoneState === "not-started" ? null : nowIso,
      factStart:
        milestoneState === "completed" ? makeIsoDate(mIdx * 7 + 2) : null,
      factEnd:
        milestoneState === "completed"
          ? makeIsoDate(mIdx * 7 + 8 + (mIdx % 3 === 0 ? 25 : 0))
          : null,
      planStart: makeIsoDate(mIdx * 7 + 1),
      planEnd: makeIsoDate(mIdx * 7 + 6),
      assigner,
      executor: executorA,
      history:
        milestoneState === "not-started"
          ? []
          : [
              {
                date: makeIsoDate(mIdx * 7 + 2),
                author: assigner,
                field: "Стадия",
                oldValue: "новая",
                newValue:
                  milestoneState === "completed"
                    ? "завершилось"
                    : "исполняется",
              },
            ],
      comments:
        milestoneState === "not-started"
          ? []
          : [
              {
                author: executorB,
                date: makeIsoDate(mIdx * 7 + 3),
                text: "Обновление по работам этапа.",
              },
            ],
      children: stageTasks,
    };
  });
}

export function MilestonesClient({
  directionId: _directionId,
  groupId: _groupId,
  projectId: _projectId,
  project,
}: MilestonesClientProps) {
  const locale = useLocale();

  // Пока не используем direction/group/project внутри клиента, но они могут понадобиться для реального API.
  void _directionId;
  void _groupId;
  void _projectId;

  const milestoneStates = React.useMemo(
    () => getMilestoneStatesFromPercent(project.stagePercent),
    [project.stagePercent],
  );

  const nodes = React.useMemo(
    () => buildTasksTree(project, milestoneStates),
    [project, milestoneStates],
  );

  const [selected, setSelected] = React.useState<SelectedNode | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"информация" | "задачи">(
    "информация",
  );

  const selectedNode = React.useMemo(() => {
    if (!selected) return null;
    const stack = [...nodes];
    while (stack.length) {
      const n = stack.pop();
      if (!n) break;
      if (n.id === selected.id && n.kind === selected.kind) return n;
      stack.push(...n.children);
    }
    return null;
  }, [nodes, selected]);

  const nowIso = new Date().toISOString();

  const milestoneDelayDays = [2, 0, 95, 14, 0, 400, 62, 0];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Вехи проекта
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{project.name}</p>
        </div>

        <div className="grid gap-6">
          <div className="space-y-4">
            {nodes.map((milestoneNode, idx) => {
              const state = milestoneNode.status;
              const stageLabel = stateToStageLabel(state);
              const cardClassByState: Record<StageState, string> = {
                "not-started": "border-neutral-200",
                started: "border-amber-200",
                "in-progress": "border-[#696cff]/60",
                completed: "border-emerald-200",
              };

              const m = String(idx + 1).padStart(2, "0");
              const base = 2026;
              const planStart = `${15 + idx}.${m}.${base}`;
              const planEnd = `${28 + idx}.${m}.${base}`;
              const delayDays = milestoneDelayDays[idx] ?? 0;
              const planDelayLabel =
                state === "completed" && delayDays > 0
                  ? `-${formatDelayDuration(delayDays)}`
                  : null;

              return (
                <button
                  key={milestoneNode.id}
                  type="button"
                  onClick={() => {
                    setSelected({ kind: "milestone", id: milestoneNode.id });
                    setActiveTab("информация");
                    setOpen(true);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex gap-4">
                    <div className="relative flex w-10 shrink-0 justify-center">
                      <div
                        className={cn(
                          "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-[11px] font-semibold",
                          state === "completed"
                            ? "border-emerald-200 text-emerald-800"
                            : state === "in-progress"
                              ? "border-[#696cff] bg-[#eef1ff] text-[#696cff]"
                              : state === "started"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-neutral-200 bg-neutral-50 text-neutral-500",
                        )}
                      >
                        {idx + 1}
                      </div>

                      {idx !== nodes.length - 1 && (
                        <div
                          aria-hidden="true"
                          className={cn(
                            "absolute top-[36px] bottom-0 w-px",
                            state === "completed"
                              ? "bg-emerald-300"
                              : state === "in-progress"
                                ? "bg-[#696cff]"
                                : state === "started"
                                  ? "bg-amber-300"
                                  : "bg-neutral-200",
                          )}
                        />
                      )}
                    </div>

                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-[0_4px_18px_rgba(34,48,62,0.06)] transition-transform hover:-translate-y-0.5",
                        cardClassByState[state],
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold text-[#1f2933]">
                            {milestoneNode.title}
                          </h2>
                          <p className="mt-1 text-xs text-[#9ca3af]">
                            <span className="font-medium text-[#6b7280]">
                              Постановщик:
                            </span>{" "}
                            {milestoneNode.assigner}
                            <span className="mx-2 text-neutral-300">·</span>
                            <span className="font-medium text-[#6b7280]">
                              Исполнитель:
                            </span>{" "}
                            {milestoneNode.children[0]?.executor ??
                              milestoneNode.executor}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold",
                            stageBadgeClass(stageLabel),
                          )}
                        >
                          {stageLabel}
                        </span>
                      </div>

                      <dl className="mt-3 grid gap-4 border-t border-neutral-100 pt-3 text-sm sm:grid-cols-2">
                        <div className="min-w-0">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                            Последняя активность
                          </dt>
                          <dd className="mt-0.5 font-medium text-[#374151]">
                            {milestoneNode.lastActivity
                              ? new Intl.DateTimeFormat(locale, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(milestoneNode.lastActivity))
                              : "—"}
                          </dd>
                        </div>
                        <div className="min-w-0 sm:border-l sm:border-neutral-100 sm:pl-4">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                            Базовый план (начало — завершение)
                          </dt>
                          <dd className="mt-0.5 font-medium text-[#374151]">
                            {planStart} — {planEnd}
                            {planDelayLabel ? (
                              <span
                                className="ml-2 inline-flex max-w-full align-middle"
                                title="Завершение позже даты базового плана"
                              >
                                <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold leading-tight text-red-700 shadow-[0_1px_0_rgba(220,38,38,0.08)]">
                                  {planDelayLabel}
                                </span>
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedNode && (
        <MilestoneTaskDialog
          open={open}
          onOpenChange={setOpen}
          selected={selectedNode}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          onSelect={(next) => {
            setSelected(next);
          }}
          computeOverdueBadge={(task) =>
            computeDelayBadgeForOverdueTask(task, nowIso)
          }
        />
      )}
    </>
  );
}
