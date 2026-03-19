import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Project } from "@/modules/directions/schemas/project.schema";
import { cn } from "@/shared/lib/utils";

type MilestoneState = "completed" | "in-progress" | "started" | "not-started";

type MilestoneStageLabel = "не начат" | "исполняется" | "завершилось";

/** Краткие поля для карточки в списке (остальное — позже в модалке). */
type MilestoneCardBrief = {
  lastActivity: string | null;
  planStart: string;
  planEnd: string;
  assigner: string;
  executor: string;
  /** Текст опоздания относительно плановой даты завершения (только если веха завершена с опозданием). */
  planDelayLabel: string | null;
};

type Milestone = {
  title: string;
};

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

/** Человекочитаемая длительность опоздания в днях. */
function formatDelayDuration(daysLate: number): string {
  if (daysLate < 1) return "";
  if (daysLate < 30) {
    return pluralRu(daysLate, "день", "дня", "дней");
  }
  if (daysLate < 365) {
    const m = Math.min(11, Math.max(1, Math.round(daysLate / 30)));
    return pluralRu(m, "месяц", "месяца", "месяцев");
  }
  const y = Math.floor(daysLate / 365);
  const rem = daysLate - y * 365;
  const mo = rem >= 25 ? Math.min(11, Math.max(1, Math.round(rem / 30))) : 0;
  if (mo > 0 && y > 0) {
    return `${pluralRu(y, "год", "года", "лет")} ${pluralRu(mo, "месяц", "месяца", "месяцев")}`;
  }
  return pluralRu(y, "год", "года", "лет");
}

const MILESTONES: Milestone[] = [
  { title: "Подготовительный этап" },
  { title: "Возведение каркаса здания" },
  { title: "Ограждающие конструкции" },
  { title: "Внутренние строительные работы" },
  { title: "Инженерные системы" },
  { title: "Наружные сети" },
  { title: "Благоустройство территории" },
  { title: "Ввод объекта в эксплуатацию" },
];

/** Мок для карточки (кратко). Полный набор полей — позже в модалке. */
function getMilestoneCardBrief(
  project: Project,
  index: number,
  state: MilestoneState,
): MilestoneCardBrief {
  const base = 2026;
  const m = String(index + 1).padStart(2, "0");
  const planStart = `${15 + index}.${m}.${base}`;
  const planEnd = `${28 + index}.${m}.${base}`;
  const assigner = project.ownerName;
  const executor =
    index % 3 === 0
      ? "Асхат Сатыбалдин"
      : index % 3 === 1
        ? "Бауржан Шакабасов"
        : "Ерлан Нурланов";

  const none = {
    planDelayLabel: null as string | null,
  };

  if (state === "not-started") {
    return {
      lastActivity: null,
      planStart,
      planEnd,
      assigner,
      executor,
      ...none,
    };
  }
  if (state === "started") {
    return {
      lastActivity: `18.${m}.${base}, 10:20`,
      planStart,
      planEnd,
      assigner,
      executor,
      ...none,
    };
  }
  if (state === "in-progress") {
    return {
      lastActivity: `21.${m}.${base}, 16:45`,
      planStart,
      planEnd,
      assigner,
      executor,
      ...none,
    };
  }

  /** Мок: опоздание в днях после плановой даты завершения вехи (0 = в срок). */
  const lateDaysByMilestone = [2, 0, 95, 14, 0, 400, 62, 0];
  const lateDays = lateDaysByMilestone[index] ?? 0;
  const planDelayLabel =
    lateDays > 0 ? `-${formatDelayDuration(lateDays)}` : null;

  return {
    lastActivity: `25.${m}.${base}, 12:00`,
    planStart,
    planEnd,
    assigner,
    executor,
    planDelayLabel,
  };
}

function stateToStageLabel(state: MilestoneState): MilestoneStageLabel {
  if (state === "completed") return "завершилось";
  if (state === "not-started") return "не начат";
  return "исполняется";
}

function stageBadgeClass(label: MilestoneStageLabel) {
  if (label === "завершилось")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (label === "не начат")
    return "border-neutral-200 bg-neutral-50 text-neutral-600";
  if (label === "исполняется")
    return "border-[#696cff] bg-[#eef1ff] text-[#696cff]";
  return "border-[#696cff] bg-[#eef1ff] text-[#696cff]";
}

const MOCK_PROJECTS: Record<string, Project[]> = {
  "1231-663": [
    {
      id: 1,
      name: "Модернизация транспортных узлов области",
      lastUpdated: "2026-02-14T10:00:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "done",
      stagePercent: 100,
      region: "г. Семей",
      tasksTotal: 24,
      tasksDone: 13,
      participants: 8,
    },
    {
      id: 2,
      name: "Развитие дорожной сети и безопасности движения",
      lastUpdated: "2026-02-10T08:30:00Z",
      ownerName: "Бауржан Шакабасов",
      stage: "planning",
      stagePercent: 35,
      region: "Аягозский район",
      tasksTotal: 16,
      tasksDone: 6,
      participants: 5,
    },
  ],
  "1231-662": [
    {
      id: 1,
      name: "Модернизация водоснабжения и очистных сооружений",
      lastUpdated: "2026-02-14T10:00:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "done",
      stagePercent: 100,
      region: "г. Семей",
      tasksTotal: 24,
      tasksDone: 13,
      participants: 8,
    },
    {
      id: 2,
      name: "Энергоэффективность: модернизация электросетей",
      lastUpdated: "2026-02-10T08:30:00Z",
      ownerName: "Бауржан Шакабасов",
      stage: "planning",
      stagePercent: 35,
      region: "Аягозский район",
      tasksTotal: 16,
      tasksDone: 6,
      participants: 5,
    },
  ],
  "1231-664": [
    {
      id: 1,
      name: "Строительство спортивного комплекса г. Аягоз (ул. Шакенова)",
      lastUpdated: "2026-02-20T09:15:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "execution",
      stagePercent: 80,
      region: "г. Аягоз",
      tasksTotal: 10,
      tasksDone: 3,
      participants: 6,
    },
  ],
};

function getMilestoneStates(project: Project): MilestoneState[] {
  const milestoneCount = MILESTONES.length;
  const states: MilestoneState[] = Array.from({ length: milestoneCount }).map(
    () => "not-started",
  );

  const percent = Math.max(0, Math.min(100, project.stagePercent));
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

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Вехи проекта" };
}

export default async function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ directionId: string; groupId: string; projectId: string }>;
}) {
  const { directionId, groupId, projectId } = await params;

  const key = `${directionId}-${groupId}`;
  const projects = MOCK_PROJECTS[key] ?? [];
  const project = projects.find((p) => p.id === Number(projectId));

  if (!project) {
    notFound();
  }

  const milestoneStates = getMilestoneStates(project);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Вехи проекта
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{project.name}</p>
      </div>

      <div className="space-y-4">
        {MILESTONES.map((milestone, idx) => {
          const state = milestoneStates[idx];
          const stageLabel = stateToStageLabel(state);
          const brief = getMilestoneCardBrief(project, idx, state);

          const cardClassByState: Record<MilestoneState, string> = {
            "not-started": "border-neutral-200",
            started: "border-amber-200",
            "in-progress": "border-[#696cff]/60",
            completed: "border-emerald-200",
          };

          const dash = "—";

          return (
            <div key={milestone.title} className="flex gap-4">
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

                {idx !== MILESTONES.length - 1 && (
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
                  "min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-[0_4px_18px_rgba(34,48,62,0.06)]",
                  cardClassByState[state],
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#1f2933]">
                      {milestone.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#9ca3af]">
                      <span className="font-medium text-[#6b7280]">
                        Постановщик:
                      </span>{" "}
                      {brief.assigner}
                      <span className="mx-2 text-neutral-300">·</span>
                      <span className="font-medium text-[#6b7280]">
                        Исполнитель:
                      </span>{" "}
                      {brief.executor}
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
                      {brief.lastActivity ?? dash}
                    </dd>
                  </div>
                  <div className="min-w-0 sm:border-l sm:border-neutral-100 sm:pl-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                      Базовый план (начало — завершение)
                    </dt>
                    <dd className="mt-0.5">
                      <span className="font-medium text-[#374151]">
                        {brief.planStart} — {brief.planEnd}
                      </span>
                      {brief.planDelayLabel ? (
                        <span
                          className="ml-2 inline-flex max-w-full align-middle"
                          title="Завершение позже даты базового плана"
                        >
                          <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold leading-tight text-red-700 shadow-[0_1px_0_rgba(220,38,38,0.08)]">
                            {brief.planDelayLabel}
                          </span>
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
