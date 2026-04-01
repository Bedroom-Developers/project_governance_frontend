"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  FileText,
  FilePenLine,
  Filter,
  Eye,
  LayoutDashboard,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { HierarchyChart } from "@/shared/components/hierarchy-chart/hierarchy-chart";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  ABAI_REGIONS,
  canAssignProtocolOrders,
  canEditHierarchy,
  DEFAULT_HIERARCHY,
  findHierarchyNode,
  flattenHierarchy,
  getAssignablePeopleForUser,
  HIERARCHY_STORAGE_KEY,
  HIERARCHY_TREE_SCHEMA_KEY,
  HIERARCHY_TREE_SCHEMA_VERSION,
  isAssigneeUnderManager,
  resolveProtocolOrderDeputyId,
  normalizeHierarchyNode,
  type HierarchyNode,
} from "@/shared/lib/app-users";
import { getClientAuthenticatedUser } from "@/shared/lib/auth";
import {
  downloadProtocolOrderSummaryPdf,
  downloadProtocolOrdersReportPdf,
  downloadProtocolOrdersReportXls,
} from "@/shared/lib/protocol-orders-report-export";
import { PROTOCOL_ORDERS_CHANGED_EVENT } from "@/shared/lib/protocol-orders-storage-reader";

const STORAGE_KEY_ORDERS = "protocol-orders-items";
const STORAGE_KEY_SCHEMA = "protocol-orders-schema-version";
/** Увеличивайте при обновлении демо-данных / схемы — кэш в браузере сбросится к INITIAL_ORDERS. */
const PROTOCOL_ORDERS_SCHEMA_VERSION = 3;
const STORAGE_KEY_VIEW = "protocol-orders-active-view";
const STORAGE_KEY_CALENDAR_NOTES = "protocol-orders-calendar-notes";
const STORAGE_KEY_PERSONAL_DRAFTS = "protocol-personal-drafts";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Ограничение для сохранения PDF в localStorage (демо без бэкенда) */
const ISSUED_PDF_MAX_BYTES = 4 * 1024 * 1024;
type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type TaskStatus =
  | "new"
  | "in_progress"
  | "on_review"
  | "approved"
  | "rejected"
  | "returned";

type TaskPriority = "critical" | "high" | "medium" | "low";
type ControlTone = "critical" | "attention" | "stable";
type ViewId =
  | "dashboard"
  | "personal"
  | "registry"
  | "calendar"
  | "analytics"
  | "reports";

type RegistryStatusFilter = "all" | TaskStatus | "overdue" | "with_extension";

type ProtocolOrder = {
  id: number;
  templateKey?: string;
  authorAccountId: string;
  authorNodeId?: string;
  authorName: string;
  assigneeNodeId: string;
  assigneeName: string;
  deputyId: string;
  sector: string;
  location?: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  controlTone: ControlTone;
  monitoringNote: string;
  progress: number;
  checklistDone: number;
  checklistTotal: number;
  response?: string;
  attachmentName?: string;
  /** PDF при выдаче задачи (виден исполнителю для скачивания) */
  issuedPdfName?: string;
  issuedPdfDataUrl?: string;
  createdAt: string;
  reviewedAt?: string;
  rejectReason?: string;
  reviewByName?: string;
  /** Сколько раз продлевали срок (для мониторинга акима / замов / администратора) */
  deadlineExtensionCount?: number;
};

type PersonalTaskDraft = {
  id: string;
  authorAccountId: string;
  title: string;
  description: string;
  monitoringNote: string;
  deadline: string;
  priority: TaskPriority;
  controlTone: ControlTone;
  sector: string;
  location: string;
  updatedAt: string;
};

type CalendarNote = {
  id: string;
  text: string;
};

function normalizePersonalDrafts(raw: unknown): PersonalTaskDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: PersonalTaskDraft[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const authorAccountId = typeof row.authorAccountId === "string" ? row.authorAccountId : "";
    const title = typeof row.title === "string" ? row.title : "";
    if (!id || !authorAccountId) continue;
    out.push({
      id,
      authorAccountId,
      title,
      description: typeof row.description === "string" ? row.description : "",
      monitoringNote: typeof row.monitoringNote === "string" ? row.monitoringNote : "",
      deadline: typeof row.deadline === "string" ? row.deadline : "",
      priority:
        row.priority === "critical" ||
        row.priority === "high" ||
        row.priority === "medium" ||
        row.priority === "low"
          ? row.priority
          : "medium",
      controlTone:
        row.controlTone === "critical" ||
        row.controlTone === "attention" ||
        row.controlTone === "stable"
          ? row.controlTone
          : "attention",
      sector: typeof row.sector === "string" ? row.sector : "",
      location: typeof row.location === "string" ? row.location : "",
      updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
    });
  }
  return out;
}

function emptyPersonalDraft(authorAccountId: string): PersonalTaskDraft {
  return {
    id: "",
    authorAccountId,
    title: "",
    description: "",
    monitoringNote: "",
    deadline: "",
    priority: "high",
    controlTone: "attention",
    sector: "",
    location: "",
    updatedAt: "",
  };
}

function normalizeCalendarNotes(value: unknown): Record<string, CalendarNote[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: Record<string, CalendarNote[]> = {};
  for (const [dateKey, list] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    if (!Array.isArray(list)) continue;
    const notes: CalendarNote[] = [];
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const text = typeof row.text === "string" ? row.text.trim().slice(0, 2000) : "";
      if (!id || !text) continue;
      notes.push({ id, text });
    }
    if (notes.length > 0) result[dateKey] = notes;
  }
  return result;
}

const INITIAL_ORDERS: ProtocolOrder[] = [
  {
    id: 101,
    templateKey: "economicReport",
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "1",
    assigneeName: "Ербол Садыр Абилхайырулы",
    deputyId: "1",
    sector: "Управление экономики и бюджетного планирования",
    location: "Семей қаласы",
    title: "Подготовить отчёт по экономическим показателям за квартал",
    description: "Собрать сводные показатели по проектам, бюджетам, рискам и исполнению KPI.",
    deadline: "2026-03-25",
    status: "on_review",
    priority: "critical",
    controlTone: "attention",
    monitoringNote: "Ожидается итоговая сверка и подпись акима.",
    progress: 95,
    checklistDone: 6,
    checklistTotal: 6,
    response: "Отчёт подготовлен. Основные показатели и риски приложены.",
    attachmentName: "otchet_ekonomika_q1.pdf",
    createdAt: "2026-03-20",
    reviewByName: "Берик Уали",
  },
  {
    id: 102,
    templateKey: "waterSupply",
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "3",
    assigneeName: "Туленбергенов Серик Тулювгалиевич",
    deputyId: "3",
    sector: "Управление энергетики и жилищно-коммунального хозяйства",
    location: "Абай ауданы",
    title: "Актуализировать план по модернизации водоснабжения",
    description: "Подготовить предложения по корректировке сроков и финансированию с учетом подрядчиков.",
    deadline: "2026-03-28",
    deadlineExtensionCount: 1,
    status: "in_progress",
    priority: "high",
    controlTone: "critical",
    monitoringNote: "Высокий общественный резонанс, требуется еженедельный мониторинг.",
    progress: 62,
    checklistDone: 4,
    checklistTotal: 7,
    createdAt: "2026-03-19",
  },
  {
    id: 103,
    templateKey: "sportComplex",
    authorAccountId: "deputy-tulenbergenov",
    authorNodeId: "3",
    authorName: "Туленбергенов Серик Тулювгалиевич",
    assigneeNodeId: "3-1",
    assigneeName: "Камария Кажгалиева",
    deputyId: "3",
    sector: "Управление строительства",
    location: "Курчатов қаласы",
    title: "Подготовить сводку по строительству спортивного комплекса",
    description: "Собрать статус по подрядчикам, освоению бюджета, отклонениям и рискам срыва графика.",
    deadline: "2026-03-24",
    deadlineExtensionCount: 2,
    status: "new",
    priority: "high",
    controlTone: "attention",
    monitoringNote: "Нужно вынести на оперативное совещание.",
    progress: 18,
    checklistDone: 1,
    checklistTotal: 5,
    createdAt: "2026-03-21",
  },
  {
    id: 104,
    templateKey: "legalConclusion",
    authorAccountId: "deputy-bakpaev",
    authorNodeId: "2",
    authorName: "Эльдар Кусманулы Бакпаев",
    assigneeNodeId: "2-1",
    assigneeName: "Руслан Бекенулы Ахметов",
    deputyId: "2",
    sector: "Управление внутренней политики",
    location: "Жаңасемей ауданы",
    title: "Подготовить правовое заключение по кадровой комиссии",
    description: "Согласовать пакет документов и приложить итоговое заключение в PDF.",
    deadline: "2026-03-26",
    status: "approved",
    priority: "medium",
    controlTone: "stable",
    monitoringNote: "Исполнено без замечаний, можно включать в месячный отчет.",
    progress: 100,
    checklistDone: 5,
    checklistTotal: 5,
    response: "Заключение подготовлено и направлено на подпись.",
    attachmentName: "kadry_pravo.pdf",
    createdAt: "2026-03-18",
    reviewedAt: "2026-03-23",
    reviewByName: "Эльдар Кусманулы Бакпаев",
  },
  {
    id: 105,
    templateKey: "vaccinationMonitoring",
    authorAccountId: "admin",
    authorName: "Системный администратор",
    assigneeNodeId: "4",
    assigneeName: "Думан Рыспекович Оспанов",
    deputyId: "4",
    sector: "Управление ветеринарии",
    location: "Үржар ауданы",
    title: "Провести мониторинг вакцинации скота по районам",
    description: "Собрать фактическое исполнение, проблемные точки и предложения по усилению контроля.",
    deadline: "2026-03-22",
    status: "returned",
    priority: "critical",
    controlTone: "critical",
    monitoringNote: "Отчет возвращен на доработку из-за неполных данных по двум районам.",
    progress: 58,
    checklistDone: 4,
    checklistTotal: 7,
    response: "Предварительная сводка направлена, требуется уточнение по районам.",
    rejectReason: "Не приложены данные по двум районам и нет фотофиксации.",
    createdAt: "2026-03-17",
    reviewByName: "Системный администратор",
  },
  {
    id: 106,
    templateKey: "culturePlan",
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "5",
    assigneeName: "Раханов Мейрлан Акылбекович",
    deputyId: "5",
    sector: "Управление культуры, развития языков и архивного дела",
    location: "Аягөз ауданы",
    title: "Подготовить план культурных мероприятий на квартал",
    description: "Сформировать календарь мероприятий с бюджетом, ответственными и KPI посещаемости.",
    deadline: "2026-03-29",
    status: "in_progress",
    priority: "medium",
    controlTone: "attention",
    monitoringNote: "Важен блок по районным центрам и медийному сопровождению.",
    progress: 47,
    checklistDone: 3,
    checklistTotal: 6,
    createdAt: "2026-03-22",
  },
  {
    id: 107,
    templateKey: "citizenReception",
    authorAccountId: "admin",
    authorName: "Системный администратор",
    assigneeNodeId: "2",
    assigneeName: "Эльдар Кусманулы Бакпаев",
    deputyId: "2",
    sector: "Управление мобилизационной подготовки и гражданской защиты",
    location: "Жарма ауданы",
    title: "Собрать статус по выездным приемам граждан районных акимов",
    description: "Нужна единая таблица по обращениям, срокам ответа и просроченным кейсам.",
    deadline: "2026-03-27",
    deadlineExtensionCount: 1,
    status: "new",
    priority: "high",
    controlTone: "attention",
    monitoringNote: "Данные пойдут в общий контрольный отчет для аппарата акима.",
    progress: 12,
    checklistDone: 1,
    checklistTotal: 6,
    createdAt: "2026-03-23",
  },
  {
    id: 108,
    templateKey: "cashExecution",
    authorAccountId: "deputy-sadyr",
    authorNodeId: "1",
    authorName: "Ербол Садыр Абилхайырулы",
    assigneeNodeId: "1-1",
    assigneeName: "Айдана Сериккызы Кайратова",
    deputyId: "1",
    sector: "Управление финансов",
    location: "Семей қаласы",
    title: "Подготовить анализ кассового исполнения по приоритетным проектам",
    description: "Выделить проекты с отставанием по освоению и предложить корректирующие меры.",
    deadline: "2026-03-30",
    status: "approved",
    priority: "high",
    controlTone: "stable",
    monitoringNote: "Можно использовать как основу для ежемесячной аналитики.",
    progress: 100,
    checklistDone: 5,
    checklistTotal: 5,
    response: "Анализ подготовлен, проекты риска выделены и приоритизированы.",
    attachmentName: "cash_execution.xlsx",
    createdAt: "2026-03-18",
    reviewedAt: "2026-03-24",
    reviewByName: "Ербол Садыр Абилхайырулы",
  },
  {
    id: 109,
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "1",
    assigneeName: "Ербол Садыр Абилхайырулы",
    deputyId: "1",
    sector: "Управление экономики и бюджетного планирования",
    location: "Семей қаласы",
    title: "Доработать сводную справку по инвестиционным соглашениям",
    description:
      "Уточнить приложения по двум объектам, добавить график платежей и актуальные суммы по контрактам.",
    deadline: "2026-04-05",
    deadlineExtensionCount: 0,
    status: "returned",
    priority: "high",
    controlTone: "attention",
    monitoringNote:
      "По результатам проверки материалы возвращены: необходимы риски и детализация платежей.",
    progress: 40,
    checklistDone: 2,
    checklistTotal: 6,
    response:
      "Черновик подготовлен; недостающие разделы будут заполнены после согласования с отделом инвестиций.",
    rejectReason:
      "Не приложены актуальные суммы по двум объектам; отсутствует график платежей и блок рисков по протоколу.",
    createdAt: "2026-03-25",
    reviewedAt: "2026-03-30",
    reviewByName: "Берик Уали",
  },
];

const STATUS_ORDER: Record<TaskStatus, number> = {
  on_review: 6,
  returned: 5,
  in_progress: 4,
  new: 3,
  rejected: 2,
  approved: 1,
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const CONTROL_ORDER: Record<ControlTone, number> = {
  critical: 3,
  attention: 2,
  stable: 1,
};

const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["critical", "high", "medium", "low"];
const CONTROL_TONE_OPTIONS: ControlTone[] = ["critical", "attention", "stable"];

const STATUS_COLORS: Record<TaskStatus, string> = {
  new: "#0b74b8",
  in_progress: "#f59e0b",
  on_review: "#8b5cf6",
  approved: "#10b981",
  rejected: "#ef4444",
  returned: "#f97316",
};

function getStatusLabel(status: TaskStatus, t: Translator) {
  return t(`status.${status}`);
}

function getStatusClasses(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    new: "bg-[#0b74b8]/10 text-[#085f96] ring-[#0b74b8]/30",
    in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
    on_review: "bg-violet-50 text-violet-700 ring-violet-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
    returned: "bg-orange-50 text-orange-700 ring-orange-600/20",
  };
  return map[status] ?? "bg-neutral-50 text-neutral-700";
}

function getPriorityLabel(priority: TaskPriority, t: Translator) {
  return t(`priority.${priority}`);
}

function getPriorityClasses(priority: TaskPriority) {
  const map: Record<TaskPriority, string> = {
    critical: "bg-rose-50 text-rose-700 ring-rose-600/20",
    high: "bg-amber-50 text-amber-700 ring-amber-600/20",
    medium: "bg-blue-50 text-blue-700 ring-blue-600/20",
    low: "bg-slate-50 text-slate-700 ring-slate-600/20",
  };
  return map[priority];
}

function getControlLabel(controlTone: ControlTone, t: Translator) {
  return t(`control.${controlTone}`);
}

function getControlClasses(controlTone: ControlTone) {
  const map: Record<ControlTone, string> = {
    critical: "bg-rose-100 text-rose-700",
    attention: "bg-amber-100 text-amber-700",
    stable: "bg-emerald-100 text-emerald-700",
  };
  return map[controlTone];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(file);
  });
}

function downloadIssuedPdf(item: ProtocolOrder) {
  if (!item.issuedPdfDataUrl || !item.issuedPdfName) return;
  const anchor = document.createElement("a");
  anchor.href = item.issuedPdfDataUrl;
  anchor.download = item.issuedPdfName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function isCompleted(status: TaskStatus) {
  return status === "approved";
}

function isOnExecutionStatus(status: TaskStatus) {
  return ["new", "in_progress", "on_review", "returned"].includes(status);
}

function canViewProtocolMonitoring(role: WorkspaceUser["role"] | undefined) {
  return role === "admin" || role === "akim" || role === "deputy";
}

function canViewRegistryExecutionStrip(role: WorkspaceUser["role"] | undefined) {
  return Boolean(role);
}

function orderHasDeadlineExtension(item: ProtocolOrder) {
  return (item.deadlineExtensionCount ?? 0) > 0;
}

function orderIsRevision(item: ProtocolOrder) {
  return item.status === "returned";
}

function AttentionBadges({ item, t }: { item: ProtocolOrder; t: Translator }) {
  const ext = orderHasDeadlineExtension(item);
  const rev = orderIsRevision(item);
  if (!ext && !rev) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ext ? (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900 ring-1 ring-sky-200/90"
          title={t("attention.extensionHint")}
        >
          <CalendarClock className="size-3 shrink-0" aria-hidden />
          {t("attention.extensionBadge", { count: item.deadlineExtensionCount ?? 0 })}
        </span>
      ) : null}
      {rev ? (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-950 ring-1 ring-orange-200/90"
          title={t("attention.revisionHint")}
        >
          <RotateCcw className="size-3 shrink-0" aria-hidden />
          {t("attention.revisionBadge")}
        </span>
      ) : null}
    </div>
  );
}

function toDateValue(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    ...options,
  }).format(new Date(`${value}T00:00:00`));
}

function getDaysUntil(deadline: string, today: string) {
  return Math.round((toDateValue(deadline) - toDateValue(today)) / DAY_MS);
}

function isOverdue(item: ProtocolOrder, today: string) {
  return !isCompleted(item.status) && getDaysUntil(item.deadline, today) < 0;
}

function getDeadlineHint(
  item: ProtocolOrder,
  today: string,
  t: Translator,
) {
  if (isCompleted(item.status)) {
    return t("deadline.closed");
  }

  const diff = getDaysUntil(item.deadline, today);
  if (diff < 0) {
    return t("deadline.overdue", { days: Math.abs(diff) });
  }
  if (diff === 0) {
    return t("deadline.today");
  }
  return t("deadline.left", { days: diff });
}

function getDeadlineClasses(item: ProtocolOrder, today: string) {
  if (isCompleted(item.status)) {
    return "bg-emerald-50 text-emerald-700";
  }
  const diff = getDaysUntil(item.deadline, today);
  if (diff < 0) {
    return "bg-rose-50 text-rose-700";
  }
  if (diff <= 2) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-slate-50 text-slate-700";
}

function buildDefaultMonitoringNote(
  priority: TaskPriority,
  controlTone: ControlTone,
  t?: Translator,
) {
  if (controlTone === "critical" || priority === "critical") {
    return t
      ? t("monitoring.defaultCritical")
      : "Требуется ежедневный мониторинг и доклад руководству.";
  }
  if (controlTone === "attention" || priority === "high") {
    return t
      ? t("monitoring.defaultAttention")
      : "Контроль раз в неделю с фиксацией промежуточных результатов.";
  }
  return t ? t("monitoring.defaultStable") : "Плановый контроль по графику исполнения.";
}

function normalizeOrders(items: ProtocolOrder[]) {
  return items.map((item) => {
    const normalizedStatus = item.status ?? "new";
    const progress =
      typeof item.progress === "number"
        ? item.progress
        : normalizedStatus === "approved"
          ? 100
          : normalizedStatus === "on_review"
            ? 90
            : normalizedStatus === "in_progress"
              ? 55
              : normalizedStatus === "returned"
                ? 45
                : 10;

    const checklistTotal = item.checklistTotal ?? 5;
    const checklistDone =
      typeof item.checklistDone === "number"
        ? item.checklistDone
        : Math.min(checklistTotal, Math.max(1, Math.round((progress / 100) * checklistTotal)));

    return {
      ...item,
      deadlineExtensionCount:
        typeof item.deadlineExtensionCount === "number" ? item.deadlineExtensionCount : 0,
      assigneeNodeId:
        item.assigneeNodeId ??
        (item as ProtocolOrder & { assigneeId?: string }).assigneeId ??
        "",
      authorAccountId:
        item.authorAccountId ??
        (item.authorName?.includes("Берик") || item.authorName?.includes("Аким")
          ? "akim-abai"
          : "admin"),
      priority: item.priority ?? "medium",
      controlTone: item.controlTone ?? "attention",
      monitoringNote:
        item.monitoringNote ??
        buildDefaultMonitoringNote(item.priority ?? "medium", item.controlTone ?? "attention"),
      progress,
      checklistDone,
      checklistTotal,
    };
  });
}

function readPersistedProtocolOrders(): ProtocolOrder[] {
  if (typeof window === "undefined") return normalizeOrders(INITIAL_ORDERS);
  try {
    const ver = Number(window.localStorage.getItem(STORAGE_KEY_SCHEMA) ?? "0");
    if (ver < PROTOCOL_ORDERS_SCHEMA_VERSION) {
      const fresh = normalizeOrders(INITIAL_ORDERS);
      window.localStorage.setItem(STORAGE_KEY_SCHEMA, String(PROTOCOL_ORDERS_SCHEMA_VERSION));
      window.localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(fresh));
      return fresh;
    }
  } catch {
    // fallback ниже
  }
  return normalizeOrders(loadFromStorage(STORAGE_KEY_ORDERS, INITIAL_ORDERS));
}

function getVisibleOrders(
  currentUser: WorkspaceUser,
  items: ProtocolOrder[],
  hierarchy: HierarchyNode,
) {
  if (currentUser.role === "admin" || currentUser.role === "akim") {
    return items;
  }

  if (currentUser.role === "deputy" && currentUser.nodeId) {
    const branchId = currentUser.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === branchId ||
        item.deputyId === branchId ||
        item.authorAccountId === currentUser.id ||
        (!!item.assigneeNodeId &&
          isAssigneeUnderManager(hierarchy, item.assigneeNodeId, branchId)),
    );
  }

  if (currentUser.role === "department_head" && currentUser.nodeId) {
    const headNodeId = currentUser.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === headNodeId ||
        item.authorAccountId === currentUser.id ||
        (!!item.assigneeNodeId &&
          isAssigneeUnderManager(hierarchy, item.assigneeNodeId, headNodeId)),
    );
  }

  if (currentUser.role === "specialist" && currentUser.nodeId) {
    const specNodeId = currentUser.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === specNodeId || item.authorAccountId === currentUser.id,
    );
  }

  return [];
}

function canSubmitOrder(currentUser: WorkspaceUser, item: ProtocolOrder) {
  return (
    currentUser.nodeId === item.assigneeNodeId &&
    ["new", "in_progress", "returned"].includes(item.status)
  );
}

function canReviewOrder(currentUser: WorkspaceUser, item: ProtocolOrder) {
  if (item.status !== "on_review") {
    return false;
  }

  if (currentUser.role === "admin" || currentUser.role === "akim") {
    return true;
  }

  if (currentUser.role === "deputy" && item.authorAccountId === currentUser.id) {
    return true;
  }

  return (
    currentUser.role === "department_head" && item.authorAccountId === currentUser.id
  );
}

function sortOrders(items: ProtocolOrder[], today: string) {
  return [...items].sort((left, right) => {
    const overdueDelta = Number(isOverdue(right, today)) - Number(isOverdue(left, today));
    if (overdueDelta !== 0) return overdueDelta;

    const controlDelta = CONTROL_ORDER[right.controlTone] - CONTROL_ORDER[left.controlTone];
    if (controlDelta !== 0) return controlDelta;

    const priorityDelta = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];
    if (priorityDelta !== 0) return priorityDelta;

    const statusDelta = STATUS_ORDER[right.status] - STATUS_ORDER[left.status];
    if (statusDelta !== 0) return statusDelta;

    return toDateValue(left.deadline) - toDateValue(right.deadline);
  });
}

function getMonthGrid(anchor: Date) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function MetricCard({
  label,
  value,
  hint,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex h-full min-h-[128px] flex-col justify-between rounded-lg border border-[#dbe5ef] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-2xl font-bold ${accent}`}>{value}</div>
          <div className="mt-1 text-sm font-medium text-[#0f172a]">{label}</div>
        </div>
        <div className="rounded-lg bg-[#edf3f8] p-2.5 text-[#085f96] ring-1 ring-[#dbe5ef]">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 border-t border-[#e7edf3] pt-3 text-xs leading-5 text-[#5f6f81]">
        {hint}
      </div>
    </div>
  );
}

export function ProtocolOrdersPageClient() {
  const t = useTranslations("protocolOrders");
  const locale = useLocale();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyNode>(DEFAULT_HIERARCHY);
  const [items, setItems] = useState<ProtocolOrder[]>(INITIAL_ORDERS);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [assigneeId, setAssigneeId] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [controlTone, setControlTone] = useState<ControlTone>("attention");
  const [monitoringNote, setMonitoringNote] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistryStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [hierarchyOpen, setHierarchyOpen] = useState(true);
  const [reportDialog, setReportDialog] = useState<ProtocolOrder | null>(null);
  const [reportResponse, setReportResponse] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reviewDialog, setReviewDialog] = useState<ProtocolOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() =>
    toInputDate(new Date()),
  );
  const [calendarNotesByDate, setCalendarNotesByDate] = useState<
    Record<string, CalendarNote[]>
  >({});
  const [calendarNoteDraft, setCalendarNoteDraft] = useState("");
  const [issuedPdfFile, setIssuedPdfFile] = useState<File | null>(null);
  const [personalDrafts, setPersonalDrafts] = useState<PersonalTaskDraft[]>([]);
  const [draftEditorOpen, setDraftEditorOpen] = useState(false);
  const [draftForm, setDraftForm] = useState<PersonalTaskDraft | null>(null);
  const [reportsScopeFilter, setReportsScopeFilter] = useState<"all" | "in_execution">("all");
  const [registryCreateOpen, setRegistryCreateOpen] = useState(false);
  const [extensionDialog, setExtensionDialog] = useState<ProtocolOrder | null>(null);
  const [extensionNewDeadline, setExtensionNewDeadline] = useState("");
  const [extensionNote, setExtensionNote] = useState("");

  useEffect(() => {
    try {
      const hVer = Number(
        typeof window !== "undefined"
          ? window.localStorage.getItem(HIERARCHY_TREE_SCHEMA_KEY) ?? "0"
          : "0",
      );
      if (typeof window !== "undefined" && hVer < HIERARCHY_TREE_SCHEMA_VERSION) {
        const fresh = normalizeHierarchyNode(DEFAULT_HIERARCHY);
        window.localStorage.setItem(HIERARCHY_TREE_SCHEMA_KEY, String(HIERARCHY_TREE_SCHEMA_VERSION));
        window.localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(fresh));
        setHierarchy(fresh);
      } else {
        setHierarchy(
          normalizeHierarchyNode(loadFromStorage(HIERARCHY_STORAGE_KEY, DEFAULT_HIERARCHY)),
        );
      }
    } catch {
      setHierarchy(normalizeHierarchyNode(DEFAULT_HIERARCHY));
    }
    setItems(readPersistedProtocolOrders());
    setActiveView(loadFromStorage(STORAGE_KEY_VIEW, "dashboard"));
    setCalendarNotesByDate(
      normalizeCalendarNotes(loadFromStorage(STORAGE_KEY_CALENDAR_NOTES, {})),
    );
    setPersonalDrafts(normalizePersonalDrafts(loadFromStorage(STORAGE_KEY_PERSONAL_DRAFTS, [])));
    setCurrentUser(getClientAuthenticatedUser());
    setIsHydrated(true);
  }, []);

  const localizedRoleLabel = (role: WorkspaceUser["role"]) => t(`roles.${role}`);
  const getSectorLabel = (sectorValue: string) => {
    const sectorMap: Record<string, string> = {
      Экономика: "sectors.economics",
      ЖКХ: "sectors.housing",
      "Акимат (кадры, юристы)": "sectors.administration",
      Ветеринария: "sectors.veterinary",
      Культура: "sectors.culture",
      Акимы: "sectors.akims",
      Финансы: "sectors.finance",
    };

    const key = sectorMap[sectorValue];
    return key ? t(key) : sectorValue;
  };
  const getOrderText = (
    item: ProtocolOrder,
    field:
      | "title"
      | "description"
      | "monitoringNote"
      | "response"
      | "rejectReason",
  ) => {
    if (!item.templateKey) {
      return item[field] ?? "";
    }

    const path = `templates.${item.templateKey}.${field}`;
    try {
      return t(path);
    } catch {
      return item[field] ?? "";
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(HIERARCHY_STORAGE_KEY, hierarchy);
  }, [hierarchy, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEY_ORDERS, items);
    window.dispatchEvent(new Event(PROTOCOL_ORDERS_CHANGED_EVENT));
  }, [items, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEY_VIEW, activeView);
  }, [activeView, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const pruned = Object.fromEntries(
      Object.entries(calendarNotesByDate).filter(([, notes]) => notes.length > 0),
    );
    saveToStorage(STORAGE_KEY_CALENDAR_NOTES, pruned);
  }, [calendarNotesByDate, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEY_PERSONAL_DRAFTS, personalDrafts);
  }, [personalDrafts, isHydrated]);

  const today = useMemo(() => toInputDate(new Date()), []);

  const assignablePeople = useMemo(
    () => (currentUser ? getAssignablePeopleForUser(currentUser, hierarchy) : []),
    [currentUser, hierarchy],
  );

  const visibleItems = useMemo(
    () =>
      currentUser
        ? sortOrders(getVisibleOrders(currentUser, items, hierarchy), today)
        : [],
    [currentUser, hierarchy, items, today],
  );

  const personalItems = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === "admin" || currentUser.role === "akim") {
      return visibleItems.filter(
        (item) =>
          item.status === "on_review" ||
          isOverdue(item, today) ||
          item.authorAccountId === currentUser.id,
      );
    }

    return visibleItems.filter(
      (item) =>
        item.assigneeNodeId === currentUser.nodeId || item.authorAccountId === currentUser.id,
    );
  }, [currentUser, today, visibleItems]);

  const myPersonalDrafts = useMemo(() => {
    if (!currentUser) return [];
    return [...personalDrafts.filter((d) => d.authorAccountId === currentUser.id)].sort((a, b) => {
      const tb = b.updatedAt ? toDateValue(b.updatedAt) : 0;
      const ta = a.updatedAt ? toDateValue(a.updatedAt) : 0;
      if (tb !== ta) return tb - ta;
      return b.id.localeCompare(a.id);
    });
  }, [currentUser, personalDrafts]);

  const draftSectorOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.sector))).sort(),
    [items],
  );

  const sectorsForAssignee = useMemo(() => {
    if (!assigneeId) return [];

    const person = flattenHierarchy(hierarchy).find((item) => item.id === assigneeId);
    if (!person) return [];

    if (person.sectors.length > 0) {
      return person.sectors;
    }

    if (person.parentId) {
      return findHierarchyNode(hierarchy, person.parentId)?.sectors ?? [];
    }

    return [];
  }, [assigneeId, hierarchy]);

  const stats = useMemo(() => {
    const total = visibleItems.length;
    const onReview = visibleItems.filter((item) => item.status === "on_review").length;
    const approved = visibleItems.filter((item) => item.status === "approved").length;
    const inWork = visibleItems.filter((item) =>
      ["new", "in_progress", "returned"].includes(item.status),
    ).length;
    const overdue = visibleItems.filter((item) => isOverdue(item, today)).length;
    const critical = visibleItems.filter((item) => item.controlTone === "critical").length;
    const executionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      onReview,
      approved,
      inWork,
      overdue,
      critical,
      executionRate,
    };
  }, [today, visibleItems]);

  const reportsScopeItems = useMemo(() => {
    if (reportsScopeFilter === "in_execution") {
      return visibleItems.filter((item) => isOnExecutionStatus(item.status));
    }
    return visibleItems;
  }, [reportsScopeFilter, visibleItems]);

  const reportsStats = useMemo(() => {
    const list = reportsScopeItems;
    const total = list.length;
    const onReview = list.filter((item) => item.status === "on_review").length;
    const approved = list.filter((item) => item.status === "approved").length;
    const overdue = list.filter((item) => isOverdue(item, today)).length;
    const critical = list.filter((item) => item.controlTone === "critical").length;
    const executionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      onReview,
      approved,
      overdue,
      critical,
      executionRate,
    };
  }, [reportsScopeItems, today]);

  const reportsMonitoringCount = useMemo(
    () =>
      reportsScopeItems.filter(
        (item) => item.controlTone !== "stable" || isOverdue(item, today),
      ).length,
    [reportsScopeItems, today],
  );

  const protocolMonitoringStats = useMemo(() => {
    const extended = visibleItems.filter((item) => orderHasDeadlineExtension(item)).length;
    const revisions = visibleItems.filter((item) => orderIsRevision(item)).length;
    const executed = visibleItems.filter((item) => item.status === "approved").length;
    const inExecution = visibleItems.filter((item) => isOnExecutionStatus(item.status)).length;
    const notExecuted = visibleItems.filter((item) => item.status === "rejected").length;

    return { extended, revisions, executed, inExecution, notExecuted };
  }, [visibleItems]);

  const canCreateOrders = currentUser
    ? canAssignProtocolOrders(currentUser.role)
    : false;

  const sectorOptions = useMemo(
    () => Array.from(new Set(visibleItems.map((item) => item.sector))).sort(),
    [visibleItems],
  );

  const registryStripCounts = useMemo(() => {
    const list = visibleItems;
    return {
      all: list.length,
      new: list.filter((i) => i.status === "new").length,
      in_progress: list.filter((i) => i.status === "in_progress").length,
      on_review: list.filter((i) => i.status === "on_review").length,
      approved: list.filter((i) => i.status === "approved").length,
      returned: list.filter((i) => i.status === "returned").length,
      with_extension: list.filter((i) => orderHasDeadlineExtension(i)).length,
      overdue: list.filter((i) => isOverdue(i, today)).length,
    };
  }, [today, visibleItems]);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return visibleItems.filter((item) => {
      const matchesSearch =
        !query ||
        getOrderText(item, "title").toLowerCase().includes(query) ||
        getOrderText(item, "description").toLowerCase().includes(query) ||
        item.assigneeName.toLowerCase().includes(query) ||
        item.authorName.toLowerCase().includes(query) ||
        getOrderText(item, "monitoringNote").toLowerCase().includes(query) ||
        getSectorLabel(item.sector).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "overdue"
            ? isOverdue(item, today)
            : statusFilter === "with_extension"
              ? orderHasDeadlineExtension(item)
              : item.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      const matchesSector = sectorFilter === "all" || item.sector === sectorFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSector;
    });
  }, [priorityFilter, searchValue, sectorFilter, statusFilter, today, visibleItems]);

  const registryMonitoringStats = useMemo(() => {
    const executed = filteredItems.filter((item) => item.status === "approved").length;
    const inExecution = filteredItems.filter((item) => isOnExecutionStatus(item.status)).length;
    const notExecuted = filteredItems.filter((item) => item.status === "rejected").length;

    return { executed, inExecution, notExecuted };
  }, [filteredItems]);

  const monitoringItems = useMemo(() => {
    const list = visibleItems.filter(
      (item) => item.controlTone !== "stable" || isOverdue(item, today),
    );
    const attentionScore = (item: ProtocolOrder) =>
      (orderHasDeadlineExtension(item) ? 2 : 0) + (orderIsRevision(item) ? 2 : 0);
    return [...list].sort((a, b) => {
      const d = attentionScore(b) - attentionScore(a);
      if (d !== 0) return d;
      const od = Number(isOverdue(b, today)) - Number(isOverdue(a, today));
      if (od !== 0) return od;
      return toDateValue(a.deadline) - toDateValue(b.deadline);
    });
  }, [today, visibleItems]);

  const reportExportTable = useMemo(() => {
    const headers = [
      t("reports.headers.task"),
      t("reports.deadline"),
      t("reports.headers.assignee"),
      t("reports.headers.sector"),
      t("reports.headers.status"),
      t("reports.headers.control"),
      t("reports.headers.extensions"),
      t("reports.headers.reviewedBy"),
      t("registry.headers.executedShort"),
      t("registry.headers.inExecutionShort"),
      t("registry.headers.notExecutedShort"),
    ];
    const rows = reportsScopeItems.map((item) => [
      getOrderText(item, "title"),
      formatDate(item.deadline, locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      item.assigneeName,
      item.location
        ? `${getSectorLabel(item.sector)} / ${item.location}`
        : getSectorLabel(item.sector),
      getStatusLabel(item.status, t),
      getControlLabel(item.controlTone, t),
      String(item.deadlineExtensionCount ?? 0),
      item.reviewByName ?? t("reports.pending"),
      item.status === "approved" ? t("registry.cellMarkYes") : t("registry.cellMarkNo"),
      isOnExecutionStatus(item.status) ? t("registry.cellMarkYes") : t("registry.cellMarkNo"),
      item.status === "rejected" ? t("registry.cellMarkYes") : t("registry.cellMarkNo"),
    ]);
    return { headers, rows };
  }, [locale, t, reportsScopeItems]);

  const handleExportReportXls = useCallback(() => {
    if (reportExportTable.rows.length === 0) {
      toast.error(t("reports.exportEmpty"));
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const scopeSuffix = reportsScopeFilter === "in_execution" ? "-in-execution" : "";
    try {
      downloadProtocolOrdersReportXls({
        sheetName: t("reports.title"),
        fileBase: `protocol-orders-report${scopeSuffix}-${stamp}`,
        headers: reportExportTable.headers,
        rows: reportExportTable.rows,
      });
    } catch {
      toast.error(t("reports.exportFailed"));
    }
  }, [
    reportExportTable.headers,
    reportExportTable.rows,
    reportsScopeFilter,
    t,
  ]);

  const handleExportReportPdf = useCallback(async () => {
    if (reportExportTable.rows.length === 0) {
      toast.error(t("reports.exportEmpty"));
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const scopeSuffix = reportsScopeFilter === "in_execution" ? "-in-execution" : "";
    const generatedAt = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const subtitle =
      reportsScopeFilter === "in_execution"
        ? `${generatedAt} · ${t("reports.exportSubtitleInExecution")}`
        : generatedAt;
    try {
      await downloadProtocolOrdersReportPdf({
        title: t("reports.title"),
        subtitle,
        headers: reportExportTable.headers,
        rows: reportExportTable.rows,
        fileBase: `protocol-orders-report${scopeSuffix}-${stamp}`,
      });
    } catch {
      toast.error(t("reports.exportFailed"));
    }
  }, [
    locale,
    reportExportTable.headers,
    reportExportTable.rows,
    reportsScopeFilter,
    t,
  ]);

  const sectorSummary = useMemo(() => {
    const map = new Map<
      string,
      { sector: string; total: number; approved: number; overdue: number; review: number }
    >();

    for (const item of visibleItems) {
      const current = map.get(item.sector) ?? {
        sector: item.sector,
        total: 0,
        approved: 0,
        overdue: 0,
        review: 0,
      };
      current.total += 1;
      if (item.status === "approved") current.approved += 1;
      if (item.status === "on_review") current.review += 1;
      if (isOverdue(item, today)) current.overdue += 1;
      map.set(item.sector, current);
    }

    return [...map.values()]
      .map((item) => ({
        ...item,
        progress: item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0,
      }))
      .sort((left, right) => right.total - left.total);
  }, [today, visibleItems]);

  const statusChartData = useMemo(
    () =>
      (
        ["new", "in_progress", "on_review", "approved", "returned", "rejected"] as TaskStatus[]
      ).map((status) => ({
        name: getStatusLabel(status, t),
        value: visibleItems.filter((item) => item.status === status).length,
        color: STATUS_COLORS[status],
      })),
    [t, visibleItems],
  );

  const sectorChartData = useMemo(
    () =>
      sectorSummary.slice(0, 6).map((item) => ({
        sector: item.sector,
        active: item.total - item.approved,
        completed: item.approved,
      })),
    [sectorSummary],
  );

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = toInputDate(date);

      return {
        label: formatDate(key, locale, { day: "2-digit", month: "short" }),
        created: visibleItems.filter((item) => item.createdAt === key).length,
        closed: visibleItems.filter(
          (item) => item.reviewedAt === key && item.status === "approved",
        ).length,
      };
    });
  }, [locale, visibleItems]);

  const calendarItemsByDate = useMemo(() => {
    return visibleItems.reduce<Record<string, ProtocolOrder[]>>((accumulator, item) => {
      accumulator[item.deadline] = [...(accumulator[item.deadline] ?? []), item];
      return accumulator;
    }, {});
  }, [visibleItems]);

  const monthGrid = useMemo(() => getMonthGrid(calendarAnchor), [calendarAnchor]);

  const calendarCellPreviews = useMemo(() => {
    const map: Record<
      string,
      {
        preview: Array<
          | { kind: "task"; key: string; item: ProtocolOrder }
          | { kind: "note"; key: string; text: string }
        >;
        total: number;
      }
    > = {};
    for (const date of monthGrid) {
      const key = toInputDate(date);
      const tasks = calendarItemsByDate[key] ?? [];
      const notes = calendarNotesByDate[key] ?? [];
      const combined = [
        ...tasks.map((item) => ({
          kind: "task" as const,
          key: `task-${item.id}`,
          item,
        })),
        ...notes.map((note) => ({
          kind: "note" as const,
          key: `note-${note.id}`,
          text: note.text,
        })),
      ];
      map[key] = { preview: combined.slice(0, 3), total: combined.length };
    }
    return map;
  }, [calendarItemsByDate, calendarNotesByDate, monthGrid]);

  const selectedDateItems = calendarItemsByDate[selectedCalendarDate] ?? [];
  const selectedDateNotes = calendarNotesByDate[selectedCalendarDate] ?? [];

  const handleAddCalendarNote = useCallback(() => {
    const text = calendarNoteDraft.trim();
    if (!text) return;
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCalendarNotesByDate((prev) => ({
      ...prev,
      [selectedCalendarDate]: [...(prev[selectedCalendarDate] ?? []), { id, text }],
    }));
    setCalendarNoteDraft("");
  }, [calendarNoteDraft, selectedCalendarDate]);

  const handleRemoveCalendarNote = useCallback(
    (noteId: string) => {
      setCalendarNotesByDate((prev) => {
        const list = prev[selectedCalendarDate] ?? [];
        const nextList = list.filter((n) => n.id !== noteId);
        const next = { ...prev };
        if (nextList.length === 0) delete next[selectedCalendarDate];
        else next[selectedCalendarDate] = nextList;
        return next;
      });
    },
    [selectedCalendarDate],
  );

  const views = [
    { id: "dashboard" as ViewId, label: t("views.dashboard"), icon: LayoutDashboard },
    { id: "personal" as ViewId, label: t("views.personal"), icon: UserRound },
    { id: "registry" as ViewId, label: t("views.registry"), icon: ClipboardList },
    { id: "calendar" as ViewId, label: t("views.calendar"), icon: CalendarDays },
    { id: "analytics" as ViewId, label: t("views.analytics"), icon: BarChart3 },
    { id: "reports" as ViewId, label: t("views.reports"), icon: FileSpreadsheet },
  ];
  const weekDays = [
    t("weekdays.mon"),
    t("weekdays.tue"),
    t("weekdays.wed"),
    t("weekdays.thu"),
    t("weekdays.fri"),
    t("weekdays.sat"),
    t("weekdays.sun"),
  ];

  const resetRegistryCreateForm = () => {
    setAssigneeId("");
    setSector("");
    setLocation("");
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("high");
    setControlTone("attention");
    setMonitoringNote("");
    setIssuedPdfFile(null);
  };

  const handleCreateOrder = async () => {
    if (!currentUser || !canCreateOrders) return;

    const person = assignablePeople.find((item) => item.id === assigneeId);
    if (!person || !sector || !location || !title.trim() || !deadline) return;

    let issuedPdfName: string | undefined;
    let issuedPdfDataUrl: string | undefined;
    if (issuedPdfFile) {
      const lower = issuedPdfFile.name.toLowerCase();
      if (!lower.endsWith(".pdf")) {
        toast.error(t("registry.issuedPdf.invalidType"));
        return;
      }
      if (
        issuedPdfFile.type &&
        issuedPdfFile.type !== "application/pdf" &&
        issuedPdfFile.type !== "application/x-pdf" &&
        !issuedPdfFile.type.includes("pdf")
      ) {
        toast.error(t("registry.issuedPdf.invalidType"));
        return;
      }
      if (issuedPdfFile.size > ISSUED_PDF_MAX_BYTES) {
        toast.error(t("registry.issuedPdf.tooLarge"));
        return;
      }
      try {
        issuedPdfDataUrl = await readFileAsDataUrl(issuedPdfFile);
      } catch {
        toast.error(t("registry.issuedPdf.readFailed"));
        return;
      }
      issuedPdfName = issuedPdfFile.name;
    }

    const nextOrder: ProtocolOrder = {
      id: Date.now(),
      authorAccountId: currentUser.id,
      authorNodeId: currentUser.nodeId,
      authorName: currentUser.name,
      assigneeNodeId: person.id,
      assigneeName: person.name,
      deputyId: resolveProtocolOrderDeputyId(hierarchy, currentUser, person.id),
      sector,
      location,
      title: title.trim(),
      description: description.trim(),
      deadline,
      deadlineExtensionCount: 0,
      status: "new",
      priority,
      controlTone,
      monitoringNote:
        monitoringNote.trim() || buildDefaultMonitoringNote(priority, controlTone, t),
      progress: 8,
      checklistDone: 0,
      checklistTotal: 5,
      createdAt: toInputDate(new Date()),
      issuedPdfName,
      issuedPdfDataUrl,
    };

    setItems((prev) => [nextOrder, ...prev]);
    resetRegistryCreateForm();
    setRegistryCreateOpen(false);
    setActiveView("registry");
  };

  const handleStartWork = (orderId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === orderId && item.status === "new"
          ? {
              ...item,
              status: "in_progress" as TaskStatus,
              progress: Math.max(item.progress, 22),
              checklistDone: Math.max(item.checklistDone, 1),
            }
          : item,
      ),
    );
  };

  const handleDownloadTaskPdf = async (item: ProtocolOrder) => {
    if (item.issuedPdfDataUrl && item.issuedPdfName) {
      downloadIssuedPdf(item);
      return;
    }
    const cell = (text: string) => {
      const s = text.trim();
      return s.length > 0 ? s : "—";
    };
    try {
      const rows: { label: string; value: string }[] = [
        { label: t("registry.fields.title"), value: cell(getOrderText(item, "title")) },
        { label: t("registry.fields.description"), value: cell(getOrderText(item, "description")) },
        { label: t("registry.fields.monitoringNote"), value: cell(getOrderText(item, "monitoringNote")) },
        { label: t("registry.headers.assignee"), value: cell(item.assigneeName) },
        { label: t("registry.assignedBy"), value: cell(item.authorName) },
        { label: t("registry.fields.sector"), value: cell(getSectorLabel(item.sector)) },
        { label: t("registry.fields.location"), value: cell(item.location ?? "") },
        {
          label: t("registry.headers.deadline"),
          value: cell(formatDate(item.deadline, locale, { day: "2-digit", month: "long" })),
        },
        { label: t("registry.headers.status"), value: cell(getStatusLabel(item.status, t)) },
        { label: t("registry.fields.priority"), value: cell(getPriorityLabel(item.priority, t)) },
        { label: t("registry.fields.control"), value: cell(getControlLabel(item.controlTone, t)) },
        { label: t("common.progress"), value: cell(`${item.progress}%`) },
        {
          label: t("registry.monitoring.extended"),
          value: String(item.deadlineExtensionCount ?? 0),
        },
        {
          label: t("reports.headers.reviewedBy"),
          value: cell(item.reviewByName ?? t("reports.pending")),
        },
      ];
      if (item.response) {
        rows.push({ label: t("registry.report"), value: cell(getOrderText(item, "response")) });
      }
      if (item.rejectReason) {
        rows.push({ label: t("registry.reason"), value: cell(getOrderText(item, "rejectReason")) });
      }
      await downloadProtocolOrderSummaryPdf({
        title: t("registry.issuedPdf.summaryDocTitle"),
        fileBase: `task-${item.id}`,
        rows,
      });
    } catch {
      toast.error(t("registry.issuedPdf.summaryFailed"));
    }
  };

  const handleSubmitReport = () => {
    if (!reportDialog) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === reportDialog.id
          ? {
              ...item,
              status: "on_review" as TaskStatus,
              response: reportResponse.trim() || item.response,
              attachmentName: reportFile?.name ?? item.attachmentName,
              progress: 95,
              checklistDone: item.checklistTotal,
              rejectReason: undefined,
            }
          : item,
      ),
    );
    setReportDialog(null);
    setReportResponse("");
    setReportFile(null);
  };

  const openExtensionDialog = (item: ProtocolOrder) => {
    setExtensionDialog(item);
    setExtensionNewDeadline(item.deadline);
    setExtensionNote("");
  };

  const handleConfirmExtension = () => {
    if (!extensionDialog || !extensionNewDeadline.trim()) return;
    if (toDateValue(extensionNewDeadline) < toDateValue(extensionDialog.deadline)) {
      toast.error(t("attention.extendInvalidDate"));
      return;
    }
    const note = extensionNote.trim();
    const dateLabel = formatDate(extensionNewDeadline, locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const line = note
      ? t("attention.extendLogLine", { date: dateLabel, note })
      : t("attention.extendLogLineNoNote", { date: dateLabel });
    setItems((prev) =>
      prev.map((item) =>
        item.id === extensionDialog.id
          ? {
              ...item,
              deadline: extensionNewDeadline,
              deadlineExtensionCount: (item.deadlineExtensionCount ?? 0) + 1,
              monitoringNote: (() => {
                const prevNote = item.monitoringNote?.trim() ?? "";
                return prevNote ? `${prevNote}\n${line}` : line;
              })(),
            }
          : item,
      ),
    );
    toast.success(t("attention.extendSuccess"));
    setExtensionDialog(null);
    setExtensionNote("");
  };

  const handleReview = (action: "approved" | "rejected" | "returned") => {
    if (!reviewDialog || !currentUser) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== reviewDialog.id) return item;
        const reason = rejectReason.trim();
        const revisionLog =
          action === "returned" && reason
            ? t("attention.revisionLogLine", { reason })
            : null;
        const prevNote = item.monitoringNote?.trim() ?? "";
        const monitoringNote =
          revisionLog && prevNote
            ? `${prevNote}\n${revisionLog}`
            : revisionLog
              ? revisionLog
              : item.monitoringNote;
        return {
          ...item,
          status: action,
          progress:
            action === "approved" ? 100 : action === "returned" ? Math.min(item.progress, 65) : 0,
          rejectReason:
            action === "rejected" || action === "returned" ? reason || undefined : undefined,
          reviewByName: currentUser.name,
          reviewedAt: toInputDate(new Date()),
          monitoringNote,
        };
      }),
    );
    setReviewDialog(null);
    setRejectReason("");
  };

  const openNewPersonalDraft = () => {
    if (!currentUser) return;
    setDraftForm(emptyPersonalDraft(currentUser.id));
    setDraftEditorOpen(true);
  };

  const openEditPersonalDraft = (draft: PersonalTaskDraft) => {
    setDraftForm({ ...draft });
    setDraftEditorOpen(true);
  };

  const savePersonalDraft = () => {
    if (!currentUser || !draftForm) return;
    if (!draftForm.title.trim()) {
      toast.error(t("personal.drafts.titleRequired"));
      return;
    }
    const id = draftForm.id || `draft-${Date.now()}`;
    const next: PersonalTaskDraft = {
      ...draftForm,
      id,
      authorAccountId: currentUser.id,
      updatedAt: toInputDate(new Date()),
    };
    setPersonalDrafts((prev) => {
      const rest = prev.filter((d) => d.id !== id);
      return [...rest, next];
    });
    setDraftEditorOpen(false);
    setDraftForm(null);
    toast.success(t("personal.drafts.saved"));
  };

  const deletePersonalDraft = (id: string) => {
    setPersonalDrafts((prev) => prev.filter((d) => d.id !== id));
    if (draftForm?.id === id) {
      setDraftEditorOpen(false);
      setDraftForm(null);
    }
    toast.success(t("personal.drafts.deleted"));
  };

  const applyPersonalDraftToRegistry = (draft: PersonalTaskDraft) => {
    setIssuedPdfFile(null);
    setTitle(draft.title);
    setDescription(draft.description);
    setMonitoringNote(draft.monitoringNote);
    setDeadline(draft.deadline);
    setPriority(draft.priority);
    setControlTone(draft.controlTone);
    setSector(draft.sector);
    setLocation(draft.location);
    setAssigneeId("");
    setActiveView("registry");
    setRegistryCreateOpen(true);
    toast.success(t("personal.drafts.prefilledHint"));
  };

  const onAssigneeChange = (id: string) => {
    setAssigneeId(id);
    setSector("");
  };

  if (!isHydrated || !currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0f]">
            {t("loadingTitle")}
          </h1>
        </div>
        <div className="rounded-lg border border-[#dbe5ef] bg-white p-5">
          <div className="h-12 animate-pulse rounded-md bg-[#edf3f8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#dbe5ef] bg-[#1f2b3a] p-6 text-white lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/8 px-3 py-1 text-xs font-semibold tracking-wide text-[#d5e8f7]">
              <ShieldCheck className="size-3.5" />
              {t("hero.badge")}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              {t("hero.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#d2deea] sm:text-base">
              {t("hero.description")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[#dbeafe]">
                {t("hero.user")}: {currentUser.name}
              </span>
              <span className="rounded-full bg-[#0b74b8]/20 px-3 py-1.5 text-[#c8e1f5]">
                {t("hero.role")}: {localizedRoleLabel(currentUser.role)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[#dbeafe]">
                {t("hero.execution")}: {stats.executionRate}%
              </span>
              {protocolMonitoringStats.extended > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/25 px-3 py-1.5 text-[#dbeafe] ring-1 ring-sky-300/30">
                  <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                  {t("hero.extensionsRibbon", { count: protocolMonitoringStats.extended })}
                </span>
              ) : null}
              {protocolMonitoringStats.revisions > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/25 px-3 py-1.5 text-[#ffe8d6] ring-1 ring-orange-300/30">
                  <RotateCcw className="size-3.5 shrink-0" aria-hidden />
                  {t("hero.revisionsRibbon", { count: protocolMonitoringStats.revisions })}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px] xl:self-end">
            <div className="flex min-h-[104px] flex-col justify-between rounded-lg border border-white/15 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[#9edfff]">{t("hero.totalTasks")}</div>
              <div className="mt-2 text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="flex min-h-[104px] flex-col justify-between rounded-lg border border-white/15 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[#9edfff]">
                {t("hero.onReview")}
              </div>
              <div className="mt-2 text-3xl font-bold">{stats.onReview}</div>
            </div>
            <div className="flex min-h-[104px] flex-col justify-between rounded-lg border border-white/15 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[#9edfff]">
                {t("hero.overdue")}
              </div>
              <div className="mt-2 text-3xl font-bold text-[#ffb4b4]">{stats.overdue}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#dbe5ef] bg-white p-2.5">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`flex min-h-[54px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#0b74b8] text-white"
                    : "bg-[#f5f8fb] text-[#3f556c] hover:bg-[#ebf1f6]"
                }`}
              >
                <Icon className="size-4" />
                {view.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeView === "dashboard" ? (
        <section className="space-y-6">
          <div
            className={`grid gap-4 md:grid-cols-2 ${currentUser && canViewProtocolMonitoring(currentUser.role) ? "xl:grid-cols-3 2xl:grid-cols-5" : "xl:grid-cols-3"}`}
          >
            {currentUser && canViewProtocolMonitoring(currentUser.role) ? (
              <>
                <MetricCard
                  label={t("dashboard.metrics.extendedDeadlines")}
                  value={protocolMonitoringStats.extended}
                  hint={t("dashboard.metrics.extendedDeadlinesHint")}
                  accent="text-sky-600"
                  icon={CalendarClock}
                />
                <MetricCard
                  label={t("dashboard.metrics.returnedRevision")}
                  value={protocolMonitoringStats.revisions}
                  hint={t("dashboard.metrics.returnedRevisionHint")}
                  accent="text-orange-600"
                  icon={RotateCcw}
                />
                <MetricCard
                  label={t("dashboard.metrics.executedTasks")}
                  value={protocolMonitoringStats.executed}
                  hint={t("dashboard.metrics.executedTasksHint")}
                  accent="text-emerald-600"
                  icon={CheckCircle2}
                />
                <MetricCard
                  label={t("dashboard.metrics.inExecution")}
                  value={protocolMonitoringStats.inExecution}
                  hint={t("dashboard.metrics.inExecutionHint")}
                  accent="text-amber-600"
                  icon={PlayCircle}
                />
                <MetricCard
                  label={t("dashboard.metrics.notExecuted")}
                  value={protocolMonitoringStats.notExecuted}
                  hint={t("dashboard.metrics.notExecutedHint")}
                  accent="text-rose-600"
                  icon={XCircle}
                />
              </>
            ) : (
              <>
                <MetricCard
                  label={t("dashboard.metrics.extendedDeadlines")}
                  value={protocolMonitoringStats.extended}
                  hint={t("dashboard.metrics.extendedDeadlinesHint")}
                  accent="text-sky-600"
                  icon={CalendarClock}
                />
                <MetricCard
                  label={t("dashboard.metrics.returnedRevision")}
                  value={protocolMonitoringStats.revisions}
                  hint={t("dashboard.metrics.returnedRevisionHint")}
                  accent="text-orange-600"
                  icon={RotateCcw}
                />
                <MetricCard
                  label={t("dashboard.metrics.executed")}
                  value={stats.approved}
                  hint={t("dashboard.metrics.executedHint")}
                  accent="text-emerald-600"
                  icon={CheckCircle2}
                />
                <MetricCard
                  label={t("dashboard.metrics.inWork")}
                  value={stats.inWork}
                  hint={t("dashboard.metrics.inWorkHint")}
                  accent="text-amber-600"
                  icon={PlayCircle}
                />
                <MetricCard
                  label={t("dashboard.metrics.onReview")}
                  value={stats.onReview}
                  hint={t("dashboard.metrics.onReviewHint")}
                  accent="text-violet-600"
                  icon={ShieldCheck}
                />
                <MetricCard
                  label={t("dashboard.metrics.redControl")}
                  value={stats.critical}
                  hint={t("dashboard.metrics.redControlHint")}
                  accent="text-rose-600"
                  icon={AlertTriangle}
                />
              </>
            )}
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.92fr)]">
            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">{t("dashboard.title")}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {t("dashboard.description")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView("registry")}
                  className="inline-flex items-center gap-2 self-start rounded-md bg-[#edf3f8] px-3 py-2 text-sm font-semibold text-[#085f96] ring-1 ring-[#dbe5ef] hover:bg-[#e6edf4]"
                >
                  {t("dashboard.goToRegistry")}
                  <ArrowRight className="size-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {monitoringItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#e1e8ef] bg-white p-4 transition hover:border-[#c7d5e3] sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getControlClasses(
                              item.controlTone,
                            )}`}
                          >
                            {getControlLabel(item.controlTone, t)}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                              item.priority,
                            )}`}
                          >
                            {getPriorityLabel(item.priority, t)}
                          </span>
                          <AttentionBadges item={item} t={t} />
                        </div>
                        <div className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-[#0f172a]">
                          {getOrderText(item, "title")}
                        </div>
                        <div className="mt-1 text-sm text-[#64748b]">
                          {item.assigneeName} · {getSectorLabel(item.sector)}
                        </div>
                      </div>
                      <div className="min-w-[112px] rounded-md bg-[#f5f8fb] px-3 py-2 text-right ring-1 ring-[#dbe5ef]">
                        <div className="text-xs text-[#64748b]">{t("common.deadline")}</div>
                        <div className="text-sm font-semibold text-[#0f172a]">
                          {formatDate(item.deadline, locale, {
                            day: "2-digit",
                            month: "long",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm leading-6 text-[#475569]">{getOrderText(item, "monitoringNote")}</div>
                    <div className="mt-4 rounded-md bg-[#f5f8fb] p-3 ring-1 ring-[#dbe5ef]">
                      <div className="mb-2 flex items-center justify-between text-xs text-[#64748b]">
                        <span>{t("common.progress")}</span>
                        <span className="font-semibold text-[#0f172a]">{item.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#e8f3fb]">
                        <div
                          className={`h-2 rounded-full ${
                            item.controlTone === "critical"
                              ? "bg-rose-500"
                              : item.controlTone === "attention"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownloadTaskPdf(item)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#dbe5ef] bg-white px-3 py-2 text-sm font-semibold text-[#085f96] hover:border-[#085f96] hover:bg-[#f8fbff]"
                    >
                      <FileDown className="size-4" />
                      {t("registry.issuedPdf.downloadTaskPdf")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid auto-rows-fr gap-6">
              <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#0f172a]">{t("dashboard.sectorsTitle")}</h3>
                <div className="mt-4 space-y-5">
                  {sectorSummary.map((item) => (
                    <div key={item.sector} className="rounded-2xl bg-[#fbfdff] p-3 ring-1 ring-[#edf5fb]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0f172a]">{getSectorLabel(item.sector)}</div>
                          <div className="text-xs text-[#64748b]">
                            {item.approved}/{item.total} {t("dashboard.executedShort")} · {item.review} {t("dashboard.onReviewShort")}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-[#085f96]">
                          {item.progress}%
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[#edf5fb]">
                        <div
                          className="h-2 rounded-full bg-[#0b74b8]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#0f172a]">{t("dashboard.decisionsTitle")}</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[22px] bg-[#f8fbff] p-4 ring-1 ring-[#edf5fb]">
                    <div className="text-sm font-semibold text-[#0f172a]">
                      {t("dashboard.decision1Title")}
                    </div>
                    <div className="mt-1 text-sm text-[#64748b]">
                      {t("dashboard.decision1Text")}
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-[#f8fbff] p-4 ring-1 ring-[#edf5fb]">
                    <div className="text-sm font-semibold text-[#0f172a]">
                      {t("dashboard.decision2Title")}
                    </div>
                    <div className="mt-1 text-sm text-[#64748b]">
                      {t("dashboard.decision2Text")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#dbe5ef] bg-white">
            <button
              type="button"
              onClick={() => setHierarchyOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#fbfdff]"
            >
              <div>
                <div className="text-lg font-semibold text-[#0f172a]">
                  {t("dashboard.hierarchyTitle")}
                </div>
                <div className="mt-1 text-sm text-[#64748b]">
                  {t("dashboard.hierarchyDescription")}
                </div>
              </div>
              {hierarchyOpen ? (
                <ChevronDown className="size-5 text-[#64748b]" />
              ) : (
                <ChevronRight className="size-5 text-[#64748b]" />
              )}
            </button>
            {hierarchyOpen ? (
              <div className="border-t border-[#dbe5ef] bg-[#f8fafc] px-5 py-4">
                <HierarchyChart
                  root={hierarchy}
                  onUpdate={setHierarchy}
                  canEdit={canEditHierarchy(currentUser.role)}
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeView === "personal" ? (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <MetricCard
              label={t("personal.metrics.focus")}
              value={personalItems.length}
              hint={t("personal.metrics.focusHint")}
              accent="text-[#085f96]"
              icon={UserRound}
            />
            <MetricCard
              label={t("personal.metrics.toReview")}
              value={personalItems.filter((item) => item.status === "on_review").length}
              hint={t("personal.metrics.toReviewHint")}
              accent="text-violet-600"
              icon={ShieldCheck}
            />
            <MetricCard
              label={t("personal.metrics.overdue")}
              value={personalItems.filter((item) => isOverdue(item, today)).length}
              hint={t("personal.metrics.overdueHint")}
              accent="text-rose-600"
              icon={AlertTriangle}
            />
            <MetricCard
              label={t("personal.metrics.executed")}
              value={personalItems.filter((item) => item.status === "approved").length}
              hint={t("personal.metrics.executedHint")}
              accent="text-emerald-600"
              icon={CheckCircle2}
            />
            <MetricCard
              label={t("personal.metrics.drafts")}
              value={myPersonalDrafts.length}
              hint={t("personal.metrics.draftsHint")}
              accent="text-slate-700"
              icon={FilePenLine}
            />
            <MetricCard
              label={t("personal.metrics.extensions")}
              value={personalItems.filter((item) => orderHasDeadlineExtension(item)).length}
              hint={t("personal.metrics.extensionsHint")}
              accent="text-sky-600"
              icon={CalendarClock}
            />
            <MetricCard
              label={t("personal.metrics.revisions")}
              value={personalItems.filter((item) => orderIsRevision(item)).length}
              hint={t("personal.metrics.revisionsHint")}
              accent="text-orange-600"
              icon={RotateCcw}
            />
          </div>

          <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">{t("personal.drafts.title")}</h3>
                <p className="mt-1 text-sm text-[#64748b]">{t("personal.drafts.subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={openNewPersonalDraft}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-[#0b74b8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085f96]"
              >
                <FilePenLine className="size-4" />
                {t("personal.drafts.new")}
              </button>
            </div>

            {myPersonalDrafts.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-[#dbe5ef] bg-[#f8fbff] px-4 py-8 text-center text-sm text-[#94a3b8]">
                {t("personal.drafts.empty")}
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myPersonalDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex flex-col rounded-xl border border-[#e1e8ef] bg-[#fbfdff] p-4 transition hover:border-[#c7d5e3]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 font-semibold text-[#0f172a]">{draft.title}</div>
                      {draft.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-[#64748b]">{draft.description}</p>
                      ) : null}
                      <div className="mt-2 text-xs text-[#94a3b8]">
                        {draft.updatedAt
                          ? t("personal.drafts.updated", {
                              date: formatDate(draft.updatedAt, locale, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }),
                            })
                          : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf4fa] pt-3">
                      <button
                        type="button"
                        onClick={() => openEditPersonalDraft(draft)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#dbe5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#085f96] hover:bg-[#f5f8fb]"
                      >
                        {t("personal.drafts.edit")}
                      </button>
                      {canCreateOrders ? (
                        <button
                          type="button"
                          onClick={() => applyPersonalDraftToRegistry(draft)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <ArrowRight className="size-3.5" />
                          {t("personal.drafts.toRegistry")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deletePersonalDraft(draft.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="size-3.5" />
                        {t("personal.drafts.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {personalItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#dbe5ef] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusClasses(
                          item.status,
                        )}`}
                      >
                        {getStatusLabel(item.status, t)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                          item.priority,
                        )}`}
                      >
                        {getPriorityLabel(item.priority, t)}
                      </span>
                      <AttentionBadges item={item} t={t} />
                    </div>
                    <div className="text-lg font-semibold text-[#0f172a]">{getOrderText(item, "title")}</div>
                    <div className="text-sm text-[#64748b]">
                      {getSectorLabel(item.sector)} · {t("personal.executor")}: {item.assigneeName}
                    </div>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${getDeadlineClasses(
                      item,
                      today,
                    )}`}
                  >
                    {getDeadlineHint(item, today, t)}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#475569]">{getOrderText(item, "description")}</p>

                <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#085f96]">
                    {t("personal.monitoring")}
                  </div>
                  <div className="mt-2 text-sm text-[#475569]">{getOrderText(item, "monitoringNote")}</div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#dbe5ef] bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    {t("registry.issuedPdf.sectionTitle")}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownloadTaskPdf(item)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b74b8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085f96] sm:w-auto"
                  >
                    <FileDown className="size-4" />
                    {t("registry.issuedPdf.downloadTaskPdf")}
                  </button>
                  {item.issuedPdfName ? (
                    <div className="mt-2 truncate text-xs text-[#64748b]" title={item.issuedPdfName}>
                      {item.issuedPdfName}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#94a3b8]">{t("registry.issuedPdf.summaryHint")}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {currentUser.nodeId === item.assigneeNodeId && item.status === "new" ? (
                    <button
                      type="button"
                      onClick={() => handleStartWork(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <PlayCircle className="size-4" />
                      {t("actions.takeToWork")}
                    </button>
                  ) : null}
                  {canSubmitOrder(currentUser, item) ? (
                    <button
                      type="button"
                      onClick={() => setReportDialog(item)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#0b74b8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#085f96]"
                    >
                      <Send className="size-4" />
                      {t("actions.sendReport")}
                    </button>
                  ) : null}
                  {canSubmitOrder(currentUser, item) ? (
                    <button
                      type="button"
                      onClick={() => openExtensionDialog(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                    >
                      <CalendarClock className="size-4" />
                      {t("attention.extendDeadline")}
                    </button>
                  ) : null}
                  {canReviewOrder(currentUser, item) ? (
                    <button
                      type="button"
                      onClick={() => setReviewDialog(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      <ShieldCheck className="size-4" />
                      {t("actions.review")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {personalItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dbe5ef] bg-white p-10 text-center text-sm text-[#94a3b8]">
              {t("personal.empty")}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === "registry" ? (
        <section className="space-y-6">
          {!canCreateOrders ? (
            <div className="rounded-xl border border-[#dbe5ef] bg-[#f8fbff] p-4 text-sm text-[#64748b]">
              {t("registry.noCreateRights")}
            </div>
          ) : null}
          <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">{t("registry.tableTitle")}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {t("registry.tableDescription")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canCreateOrders ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetRegistryCreateForm();
                        setRegistryCreateOpen(true);
                      }}
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#0b74b8] px-4 text-sm font-semibold text-white transition hover:bg-[#085f96]"
                    >
                      <Plus className="size-4" />
                      {t("registry.newTask")}
                    </button>
                  ) : null}
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder={t("registry.search")}
                      className="h-11 w-full rounded-2xl border border-[#00BFFF]/15 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#00BFFF]/15 bg-[#f8fbff] px-4 text-sm font-semibold text-[#47637a]"
                  >
                    <Filter className="size-4" />
                    {t("registry.filters")}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex w-full min-w-0 gap-2 overflow-x-auto pb-1 sm:gap-3">
                {(
                  [
                    { id: "all" as const, label: t("registry.strip.total"), Icon: ClipboardList },
                    { id: "new" as const, label: t("registry.strip.new"), Icon: Briefcase },
                    { id: "in_progress" as const, label: t("registry.strip.inProgress"), Icon: Clock },
                    { id: "on_review" as const, label: t("registry.strip.onReview"), Icon: Eye },
                    { id: "approved" as const, label: t("registry.strip.completed"), Icon: CheckCircle2 },
                    { id: "returned" as const, label: t("registry.strip.returned"), Icon: RotateCcw },
                    {
                      id: "with_extension" as const,
                      label: t("registry.strip.withExtension"),
                      Icon: CalendarClock,
                    },
                    { id: "overdue" as const, label: t("registry.strip.overdue"), Icon: AlertTriangle },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const count =
                    id === "all"
                      ? registryStripCounts.all
                      : id === "overdue"
                        ? registryStripCounts.overdue
                        : id === "with_extension"
                          ? registryStripCounts.with_extension
                          : id === "returned"
                            ? registryStripCounts.returned
                            : registryStripCounts[id];
                  const selected = statusFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatusFilter(id)}
                      className={`flex min-w-0 flex-1 basis-0 flex-col items-center justify-center rounded-2xl border bg-white px-2 py-5 text-center shadow-sm transition sm:px-4 sm:py-6 ${
                        selected
                          ? "border-[#0b74b8] ring-2 ring-[#0b74b8]/25"
                          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                      }`}
                    >
                      <div
                        className={`mb-3 grid size-11 shrink-0 place-items-center rounded-full sm:size-14 ${
                          selected ? "bg-[#e8f4fc] text-[#085f96]" : "bg-[#f1f5f9] text-[#64748b]"
                        }`}
                      >
                        <Icon className="size-5 sm:size-7" strokeWidth={2} />
                      </div>
                      <div className="text-xl font-bold tabular-nums text-[#0f172a] sm:text-3xl">{count}</div>
                      <div className="mt-2 max-w-full text-center text-[10px] font-semibold leading-snug text-[#64748b] sm:text-xs">
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as RegistryStatusFilter)
                  }
                  className="h-11 rounded-2xl border border-[#00BFFF]/15 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
                >
                  <option value="all">{t("registry.allStatuses")}</option>
                  <option value="new">{t("status.new")}</option>
                  <option value="in_progress">{t("status.in_progress")}</option>
                  <option value="on_review">{t("status.on_review")}</option>
                  <option value="approved">{t("status.approved")}</option>
                  <option value="returned">{t("status.returned")}</option>
                  <option value="rejected">{t("status.rejected")}</option>
                  <option value="overdue">{t("registry.strip.overdue")}</option>
                  <option value="with_extension">{t("registry.filter.withExtension")}</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as "all" | TaskPriority)
                  }
                  className="h-11 rounded-2xl border border-[#00BFFF]/15 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
                >
                  <option value="all">{t("registry.allPriorities")}</option>
                  <option value="critical">{t("priority.critical")}</option>
                  <option value="high">{t("priority.high")}</option>
                  <option value="medium">{t("priority.medium")}</option>
                  <option value="low">{t("priority.low")}</option>
                </select>
                <select
                  value={sectorFilter}
                  onChange={(event) => setSectorFilter(event.target.value)}
                  className="h-11 rounded-2xl border border-[#00BFFF]/15 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
                >
                  <option value="all">{t("registry.allSectors")}</option>
                  {sectorOptions.map((item) => (
                    <option key={item} value={item}>
                      {getSectorLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              {currentUser && canViewRegistryExecutionStrip(currentUser.role) ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-[#dbe5ef] bg-[#f8fbff] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      {t("registry.monitoring.executed")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700">
                      {registryMonitoringStats.executed}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dbe5ef] bg-[#f8fbff] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      {t("registry.monitoring.inExecution")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-amber-700">
                      {registryMonitoringStats.inExecution}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dbe5ef] bg-[#f8fbff] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      {t("registry.monitoring.notExecuted")}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-rose-700">
                      {registryMonitoringStats.notExecuted}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 overflow-hidden rounded-3xl border border-[#ecf3f9]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#edf4fa] text-sm">
                    <thead className="bg-[#f8fbff]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                          {t("registry.headers.task")}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                          {t("registry.headers.assignee")}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                          {t("registry.headers.deadline")}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                          {t("registry.headers.status")}
                        </th>
                        {currentUser && canViewProtocolMonitoring(currentUser.role) ? (
                          <>
                            <th className="min-w-[100px] px-3 py-3 text-center font-semibold text-[#64748b]">
                              {t("registry.headers.executed")}
                            </th>
                            <th className="min-w-[100px] px-3 py-3 text-center font-semibold text-[#64748b]">
                              {t("registry.headers.inExecution")}
                            </th>
                            <th className="min-w-[100px] px-3 py-3 text-center font-semibold text-[#64748b]">
                              {t("registry.headers.notExecuted")}
                            </th>
                          </>
                        ) : null}
                        <th className="px-4 py-3 text-right font-semibold text-[#64748b]">
                          {t("registry.headers.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf4fa] bg-white">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`align-top hover:bg-[#fbfdff] ${
                            orderIsRevision(item)
                              ? "bg-orange-50/60"
                              : orderHasDeadlineExtension(item)
                                ? "bg-sky-50/50"
                                : ""
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0f172a]">{getOrderText(item, "title")}</div>
                            <div className="mt-1 text-sm text-[#64748b]">{getOrderText(item, "description")}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getPriorityClasses(
                                  item.priority,
                                )}`}
                              >
                                {getPriorityLabel(item.priority, t)}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getControlClasses(
                                  item.controlTone,
                                )}`}
                              >
                                {getControlLabel(item.controlTone, t)}
                              </span>
                              <AttentionBadges item={item} t={t} />
                            </div>
                            {item.response ? (
                              <div className="mt-3 rounded-2xl bg-[#f8fbff] px-3 py-2 text-xs text-[#475569]">
                                <span className="font-semibold text-[#0f172a]">{t("registry.report")}:</span>{" "}
                                {getOrderText(item, "response")}
                              </div>
                            ) : null}
                            {item.rejectReason ? (
                              <div className="mt-2 text-xs font-medium text-rose-600">
                                {t("registry.reason")}: {getOrderText(item, "rejectReason")}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0f172a]">{item.assigneeName}</div>
                            <div className="text-sm text-[#64748b]">{getSectorLabel(item.sector)}</div>
                            {item.location ? (
                              <div className="text-xs text-[#8fa0b2]">{item.location}</div>
                            ) : null}
                            <div className="mt-1 text-xs text-[#94a3b8]">
                              {t("registry.assignedBy")}: {item.authorName}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0f172a]">
                              {formatDate(item.deadline, locale, { day: "2-digit", month: "long" })}
                            </div>
                            <div
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getDeadlineClasses(
                                item,
                                today,
                              )}`}
                            >
                              {getDeadlineHint(item, today, t)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                                item.status,
                              )}`}
                            >
                              {getStatusLabel(item.status, t)}
                            </span>
                          </td>
                          {currentUser && canViewProtocolMonitoring(currentUser.role) ? (
                            <>
                              <td className="px-3 py-4 text-center align-middle">
                                {item.status === "approved" ? (
                                  <CheckCircle2
                                    className="mx-auto size-5 text-emerald-600"
                                    aria-label={t("registry.cellMarkYes")}
                                  />
                                ) : (
                                  <span className="text-[#cbd5e1]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-center align-middle">
                                {isOnExecutionStatus(item.status) ? (
                                  <PlayCircle
                                    className="mx-auto size-5 text-amber-600"
                                    aria-label={t("registry.cellMarkYes")}
                                  />
                                ) : (
                                  <span className="text-[#cbd5e1]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-center align-middle">
                                {item.status === "rejected" ? (
                                  <XCircle
                                    className="mx-auto size-5 text-rose-600"
                                    aria-label={t("registry.cellMarkYes")}
                                  />
                                ) : (
                                  <span className="text-[#cbd5e1]">—</span>
                                )}
                              </td>
                            </>
                          ) : null}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleDownloadTaskPdf(item)}
                                className="inline-flex items-center gap-1 rounded-xl border border-[#dbe5ef] bg-white px-2.5 py-2 text-xs font-semibold text-[#085f96] hover:border-[#085f96] hover:bg-[#f8fbff]"
                                title={t("registry.issuedPdf.downloadTaskPdf")}
                                aria-label={t("registry.issuedPdf.downloadTaskPdf")}
                              >
                                <FileDown className="size-3.5" />
                                <span>{t("registry.issuedPdf.shortLabel")}</span>
                              </button>
                              {currentUser.nodeId === item.assigneeNodeId && item.status === "new" ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartWork(item.id)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                >
                                  <PlayCircle className="size-3.5" />
                                  {t("actions.takeToWork")}
                                </button>
                              ) : null}
                              {canSubmitOrder(currentUser, item) ? (
                                <button
                                  type="button"
                                  onClick={() => setReportDialog(item)}
                                  className="inline-flex items-center gap-1 rounded-md bg-[#0b74b8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#085f96]"
                                >
                                  <Send className="size-3.5" />
                                  {t("actions.submitForReview")}
                                </button>
                              ) : null}
                              {canSubmitOrder(currentUser, item) ? (
                                <button
                                  type="button"
                                  onClick={() => openExtensionDialog(item)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                                >
                                  <CalendarClock className="size-3.5" />
                                  {t("attention.extendDeadline")}
                                </button>
                              ) : null}
                              {canReviewOrder(currentUser, item) ? (
                                <button
                                  type="button"
                                  onClick={() => setReviewDialog(item)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                                >
                                  {t("actions.review")}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={
                              currentUser && canViewProtocolMonitoring(currentUser.role) ? 8 : 5
                            }
                            className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                          >
                            {t("registry.empty")}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </section>
      ) : null}

      {registryCreateOpen && canCreateOrders ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setRegistryCreateOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registry-create-title"
          >
            <h2 id="registry-create-title" className="text-xl font-semibold text-[#0f172a]">
              {t("registry.createTitle")}
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">{t("registry.createDescription")}</p>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.assignee")}</label>
                <select
                  value={assigneeId}
                  onChange={(event) => onAssigneeChange(event.target.value)}
                  className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                >
                  <option value="">{t("registry.placeholders.assignee")}</option>
                  {assignablePeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.sector")}</label>
                  <select
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                    className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  >
                    <option value="">{t("registry.placeholders.sector")}</option>
                    {sectorsForAssignee.map((item) => (
                      <option key={item} value={item}>
                        {getSectorLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.location")}</label>
                  <select
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  >
                    <option value="">{t("registry.placeholders.location")}</option>
                    {ABAI_REGIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.deadline")}</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.priority")}</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as TaskPriority)}
                    className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  >
                    <option value="critical">{t("priority.critical")}</option>
                    <option value="high">{t("priority.high")}</option>
                    <option value="medium">{t("priority.medium")}</option>
                    <option value="low">{t("priority.low")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.control")}</label>
                  <select
                    value={controlTone}
                    onChange={(event) => setControlTone(event.target.value as ControlTone)}
                    className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  >
                    <option value="critical">{t("control.critical")}</option>
                    <option value="attention">{t("control.attention")}</option>
                    <option value="stable">{t("control.stable")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.title")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("registry.placeholders.title")}
                  className="h-11 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.description")}</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("registry.placeholders.description")}
                  rows={4}
                  className="w-full rounded-md border border-[#dbe5ef] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.monitoringNote")}</label>
                <textarea
                  value={monitoringNote}
                  onChange={(event) => setMonitoringNote(event.target.value)}
                  placeholder={t("registry.placeholders.monitoringNote")}
                  rows={3}
                  className="w-full rounded-md border border-[#dbe5ef] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0f172a]">{t("registry.fields.issuedPdf")}</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setIssuedPdfFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-[#64748b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf3f8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#085f96]"
                />
                {issuedPdfFile ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dbe5ef] bg-[#f8fbff] px-3 py-2 text-sm">
                    <FileText className="size-4 shrink-0 text-[#085f96]" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[#0f172a]">
                      {issuedPdfFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIssuedPdfFile(null)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      {t("registry.issuedPdf.remove")}
                    </button>
                  </div>
                ) : null}
                <p className="text-xs leading-relaxed text-[#64748b]">{t("registry.issuedPdf.hint")}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#edf4fa] pt-5">
              <button
                type="button"
                onClick={() => setRegistryCreateOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe5ef] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a] hover:border-[#085f96] hover:text-[#085f96]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateOrder()}
                className="inline-flex items-center gap-2 rounded-full bg-[#0b74b8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085f96]"
              >
                <Send className="size-4" />
                {t("registry.submit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeView === "calendar" ? (
        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">{t("calendar.title")}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {t("calendar.description")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarAnchor(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                      )
                    }
                    className="grid size-10 place-items-center rounded-md border border-[#dbe5ef] bg-[#f5f8fb] text-[#3f556c]"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="min-w-[180px] rounded-md bg-[#f5f8fb] px-4 py-2 text-center text-sm font-semibold text-[#0f172a]">
                    {new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
                      month: "long",
                      year: "numeric",
                    }).format(calendarAnchor)}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarAnchor(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                      )
                    }
                    className="grid size-10 place-items-center rounded-md border border-[#dbe5ef] bg-[#f5f8fb] text-[#3f556c]"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="rounded-md bg-[#f5f8fb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6f81]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {monthGrid.map((date) => {
                  const dateKey = toInputDate(date);
                  const cell = calendarCellPreviews[dateKey] ?? { preview: [], total: 0 };
                  const isCurrentMonth = date.getMonth() === calendarAnchor.getMonth();
                  const isSelected = dateKey === selectedCalendarDate;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedCalendarDate(dateKey)}
                      className={`min-h-[120px] rounded-md border p-3 text-left transition ${
                        isSelected
                          ? "border-[#0b74b8]/40 bg-[#edf3f8]"
                          : "border-[#e4ebf2] bg-white hover:border-[#c6d5e4]"
                      } ${isCurrentMonth ? "" : "opacity-45"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0f172a]">
                          {date.getDate()}
                        </span>
                        {dateKey === today ? (
                          <span className="rounded-full bg-[#0b74b8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#085f96]">
                            {t("calendar.today")}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 space-y-2">
                        {cell.preview.map((entry) =>
                          entry.kind === "task" ? (
                            <div
                              key={entry.key}
                              className={`rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                                orderIsRevision(entry.item)
                                  ? "bg-orange-50 text-orange-900"
                                  : orderHasDeadlineExtension(entry.item)
                                    ? "bg-sky-50 text-sky-900"
                                    : entry.item.controlTone === "critical"
                                      ? "bg-rose-50 text-rose-700"
                                      : entry.item.controlTone === "attention"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-[#edf3f8] text-[#085f96]"
                              }`}
                            >
                              <div>
                                {entry.item.assigneeName.split(" ")[0]} ·{" "}
                                {getOrderText(entry.item, "title")}
                              </div>
                              <div className="mt-1">
                                <AttentionBadges item={entry.item} t={t} />
                              </div>
                            </div>
                          ) : (
                            <div
                              key={entry.key}
                              className="rounded-xl bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-900"
                            >
                              {entry.text}
                            </div>
                          ),
                        )}
                        {cell.total > 3 ? (
                          <div className="text-[11px] font-semibold text-[#64748b]">
                            {t("calendar.more", { count: cell.total - 3 })}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <div className="flex items-center gap-2 text-[#085f96]">
                <CalendarClock className="size-5" />
                <h3 className="text-lg font-semibold text-[#0f172a]">
                  {t("calendar.tasksFor")} {formatDate(selectedCalendarDate, locale, { day: "2-digit", month: "long" })}
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {selectedDateItems.length === 0 && selectedDateNotes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#d7e1eb] p-8 text-center text-sm text-[#8092a5]">
                    {t("calendar.empty")}
                  </div>
                ) : null}

                {selectedDateItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg p-4 ${
                      orderIsRevision(item)
                        ? "bg-orange-50/80 ring-1 ring-orange-100"
                        : orderHasDeadlineExtension(item)
                          ? "bg-sky-50/80 ring-1 ring-sky-100"
                          : "bg-[#f5f8fb]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-[#0f172a]">{getOrderText(item, "title")}</div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {item.assigneeName} · {getSectorLabel(item.sector)}
                          {item.location ? ` · ${item.location}` : ""}
                        </div>
                        <div className="mt-2">
                          <AttentionBadges item={item} t={t} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDownloadTaskPdf(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#dbe5ef] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#085f96] hover:border-[#085f96]"
                          title={t("registry.issuedPdf.downloadTaskPdf")}
                          aria-label={t("registry.issuedPdf.downloadTaskPdf")}
                        >
                          <FileDown className="size-3.5" />
                          {t("registry.issuedPdf.shortLabel")}
                        </button>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          {getStatusLabel(item.status, t)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-[#475569]">{getOrderText(item, "monitoringNote")}</div>
                  </div>
                ))}

                {selectedDateNotes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                      {t("calendar.notesTitle")}
                    </div>
                    {selectedDateNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/90 p-3"
                      >
                        <p className="min-w-0 flex-1 text-sm leading-relaxed text-amber-950">{note.text}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveCalendarNote(note.id)}
                          className="grid size-9 shrink-0 place-items-center rounded-xl text-amber-800/80 transition hover:bg-amber-100 hover:text-amber-950"
                          aria-label={t("calendar.deleteNoteAria")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-lg border border-[#dbe5ef] bg-[#f5f8fb] p-4">
                  <label className="text-xs font-semibold text-[#3f556c]" htmlFor="calendar-note-draft">
                    {t("calendar.addNoteLabel")}
                  </label>
                  <textarea
                    id="calendar-note-draft"
                    value={calendarNoteDraft}
                    onChange={(event) => setCalendarNoteDraft(event.target.value)}
                    placeholder={t("calendar.notePlaceholder")}
                    rows={3}
                    className="mt-2 w-full resize-y rounded-md border border-[#dbe5ef] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddCalendarNote}
                      disabled={!calendarNoteDraft.trim()}
                      className="rounded-md bg-[#0b74b8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#085f96] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {t("calendar.addNote")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === "analytics" ? (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("analytics.metrics.execution")}
              value={`${stats.executionRate}%`}
              hint={t("analytics.metrics.executionHint")}
              accent="text-emerald-600"
              icon={CheckCircle2}
            />
            <MetricCard
              label={t("analytics.metrics.overdue")}
              value={stats.overdue}
              hint={t("analytics.metrics.overdueHint")}
              accent="text-rose-600"
              icon={AlertTriangle}
            />
            <MetricCard
              label={t("analytics.metrics.onReview")}
              value={stats.onReview}
              hint={t("analytics.metrics.onReviewHint")}
              accent="text-violet-600"
              icon={ShieldCheck}
            />
            <MetricCard
              label={t("analytics.metrics.underControl")}
              value={monitoringItems.length}
              hint={t("analytics.metrics.underControlHint")}
              accent="text-[#0099cc]"
              icon={BarChart3}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <h3 className="text-lg font-semibold text-[#0f172a]">{t("analytics.statusesTitle")}</h3>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-[#f8fbff] px-3 py-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#475569]">{item.name}</span>
                    <span className="ml-auto text-sm font-semibold text-[#0f172a]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
              <h3 className="text-lg font-semibold text-[#0f172a]">{t("analytics.trendTitle")}</h3>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0b74b8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0b74b8" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="closedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e8f1f8" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#0b74b8"
                      fill="url(#createdGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="closed"
                      stroke="#10b981"
                      fill="url(#closedGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

            <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
            <h3 className="text-lg font-semibold text-[#0f172a]">{t("analytics.sectorsTitle")}</h3>
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorChartData}>
                  <CartesianGrid stroke="#e8f1f8" vertical={false} />
                  <XAxis dataKey="sector" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="active" stackId="a" fill="#0b74b8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === "reports" ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#0f172a]">{t("reports.title")}</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {t("reports.description")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex min-w-[200px] flex-col gap-1">
                <label
                  className="text-xs font-semibold text-[#64748b]"
                  htmlFor="reports-scope-filter"
                >
                  {t("reports.filterScope")}
                </label>
                <select
                  id="reports-scope-filter"
                  value={reportsScopeFilter}
                  onChange={(event) =>
                    setReportsScopeFilter(event.target.value as "all" | "in_execution")
                  }
                  className="rounded-lg border border-[#dbe5ef] bg-white px-3 py-2.5 text-sm font-medium text-[#0f172a] shadow-sm outline-none ring-[#085f96]/30 focus:ring-2"
                >
                  <option value="all">{t("reports.filterAll")}</option>
                  <option value="in_execution">{t("reports.filterInExecution")}</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleExportReportPdf()}
                  className="inline-flex items-center gap-2 rounded-md border border-[#dbe5ef] bg-white px-4 py-3 text-sm font-semibold text-[#3f556c] transition hover:bg-[#f5f8fb]"
                >
                  <FileDown className="size-4" />
                  {t("reports.exportPdf")}
                </button>
                <button
                  type="button"
                  onClick={handleExportReportXls}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0b74b8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#085f96]"
                >
                  <FileSpreadsheet className="size-4" />
                  {t("reports.exportXls")}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("reports.metrics.total")}
              value={reportsStats.total}
              hint={t("reports.metrics.totalHint")}
              accent="text-[#085f96]"
              icon={ClipboardList}
            />
            <MetricCard
              label={t("reports.metrics.executed")}
              value={reportsStats.approved}
              hint={t("reports.metrics.executedHint")}
              accent="text-emerald-600"
              icon={CheckCircle2}
            />
            <MetricCard
              label={t("reports.metrics.underControl")}
              value={reportsMonitoringCount}
              hint={t("reports.metrics.underControlHint")}
              accent="text-amber-600"
              icon={ShieldCheck}
            />
            <MetricCard
              label={t("reports.metrics.overdue")}
              value={reportsStats.overdue}
              hint={t("reports.metrics.overdueHint")}
              accent="text-rose-600"
              icon={AlertTriangle}
            />
          </div>

          <div className="rounded-xl border border-[#dbe5ef] bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#085f96]">
                  {t("reports.summaryTitle")}
                </div>
                <div className="mt-2 text-sm text-[#475569]">
                  {t("reports.summaryText", {
                    rate: reportsStats.executionRate,
                    onReview: reportsStats.onReview,
                    overdue: reportsStats.overdue,
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#085f96]">
                  {t("reports.risksTitle")}
                </div>
                <div className="mt-2 text-sm text-[#475569]">
                  {t("reports.risksText", { critical: reportsStats.critical })}
                </div>
              </div>
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#085f96]">
                  {t("reports.conclusionTitle")}
                </div>
                <div className="mt-2 text-sm text-[#475569]">
                  {t("reports.conclusionText")}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-[#ecf3f9]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#edf4fa] text-sm">
                  <thead className="bg-[#f8fbff]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">{t("reports.headers.task")}</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                        {t("reports.headers.assignee")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                        {t("reports.headers.sector")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                        {t("reports.headers.status")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                        {t("reports.headers.control")}
                      </th>
                      <th className="min-w-[120px] px-4 py-3 text-center font-semibold text-[#64748b]">
                        {t("reports.headers.extensions")}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#64748b]">
                        {t("reports.headers.reviewedBy")}
                      </th>
                      <th className="w-[100px] px-3 py-3 text-center font-semibold text-[#64748b]">
                        {t("registry.issuedPdf.shortLabel")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf4fa] bg-white">
                    {reportsScopeItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                        >
                          {t("reports.tableEmpty")}
                        </td>
                      </tr>
                    ) : (
                      reportsScopeItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0f172a]">{getOrderText(item, "title")}</div>
                            <div className="mt-1 text-xs text-[#64748b]">
                              {t("reports.deadline")}:{" "}
                              {formatDate(item.deadline, locale, { day: "2-digit", month: "long" })}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#475569]">{item.assigneeName}</td>
                          <td className="px-4 py-4 text-[#475569]">
                            <div>{getSectorLabel(item.sector)}</div>
                            {item.location ? (
                              <div className="text-xs text-[#8fa0b2]">{item.location}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                                item.status,
                              )}`}
                            >
                              {getStatusLabel(item.status, t)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getControlClasses(
                                item.controlTone,
                              )}`}
                            >
                              {getControlLabel(item.controlTone, t)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center align-middle">
                            <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-[#f1f5f9] px-2 py-1 text-sm font-semibold tabular-nums text-[#0f172a]">
                              {item.deadlineExtensionCount ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[#475569]">
                            {item.reviewByName ?? t("reports.pending")}
                          </td>
                          <td className="px-3 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => void handleDownloadTaskPdf(item)}
                              className="inline-flex items-center justify-center rounded-lg border border-[#dbe5ef] bg-white p-2 text-[#085f96] hover:border-[#085f96] hover:bg-[#f8fbff]"
                              title={t("registry.issuedPdf.downloadTaskPdf")}
                              aria-label={t("registry.issuedPdf.downloadTaskPdf")}
                            >
                              <FileDown className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {draftEditorOpen && draftForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[#0f172a]">
              {draftForm.id ? t("personal.drafts.editTitle") : t("personal.drafts.newTitle")}
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">{t("personal.drafts.modalHint")}</p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748b]">
                  {t("registry.fields.title")}
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                  value={draftForm.title}
                  onChange={(e) =>
                    setDraftForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b]">
                  {t("registry.fields.description")}
                </label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                  value={draftForm.description}
                  onChange={(e) =>
                    setDraftForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b]">
                  {t("registry.fields.monitoringNote")}
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                  value={draftForm.monitoringNote}
                  onChange={(e) =>
                    setDraftForm((prev) => (prev ? { ...prev, monitoringNote: e.target.value } : prev))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b]">
                    {t("registry.fields.deadline")}
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                    value={draftForm.deadline}
                    onChange={(e) =>
                      setDraftForm((prev) => (prev ? { ...prev, deadline: e.target.value } : prev))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b]">
                    {t("registry.fields.priority")}
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                    value={draftForm.priority}
                    onChange={(e) =>
                      setDraftForm((prev) =>
                        prev ? { ...prev, priority: e.target.value as TaskPriority } : prev,
                      )
                    }
                  >
                    {TASK_PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {t(`registry.priority.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b]">
                    {t("registry.fields.controlTone")}
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                    value={draftForm.controlTone}
                    onChange={(e) =>
                      setDraftForm((prev) =>
                        prev ? { ...prev, controlTone: e.target.value as ControlTone } : prev,
                      )
                    }
                  >
                    {CONTROL_TONE_OPTIONS.map((tone) => (
                      <option key={tone} value={tone}>
                        {t(`registry.controlTone.${tone}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b]">
                    {t("registry.fields.sector")}
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                    value={draftForm.sector}
                    onChange={(e) =>
                      setDraftForm((prev) => (prev ? { ...prev, sector: e.target.value } : prev))
                    }
                  >
                    {draftSectorOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748b]">
                  {t("registry.fields.location")}
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#dbe5ef] px-3 py-2 text-sm text-[#0f172a]"
                  value={draftForm.location}
                  onChange={(e) =>
                    setDraftForm((prev) => (prev ? { ...prev, location: e.target.value } : prev))
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  savePersonalDraft();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#085f96] px-5 py-2 text-sm font-semibold text-white hover:bg-[#074a7a]"
              >
                {t("personal.drafts.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftEditorOpen(false);
                  setDraftForm(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe5ef] bg-white px-5 py-2 text-sm font-semibold text-[#0f172a] hover:border-[#085f96] hover:text-[#085f96]"
              >
                {t("modals.returnDialog.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[#0f172a]">{t("modals.report.title")}</h3>
            <p className="mt-1 text-sm text-[#64748b]">{getOrderText(reportDialog, "title")}</p>
            {reportDialog.issuedPdfDataUrl && reportDialog.issuedPdfName ? (
              <div className="mt-4 rounded-2xl border border-[#dbe5ef] bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold text-[#64748b]">{t("registry.issuedPdf.sectionTitle")}</div>
                <button
                  type="button"
                  onClick={() => downloadIssuedPdf(reportDialog)}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#085f96] hover:underline"
                >
                  <FileDown className="size-4" />
                  {reportDialog.issuedPdfName}
                </button>
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0f172a]">{t("modals.report.response")}</label>
                <textarea
                  value={reportResponse}
                  onChange={(event) => setReportResponse(event.target.value)}
                  placeholder={t("modals.report.responsePlaceholder")}
                  rows={5}
                  className="mt-1.5 w-full rounded-2xl border border-[#00BFFF]/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0f172a]">{t("modals.report.attachment")}</label>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.doc,.docx"
                  onChange={(event) => setReportFile(event.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-sm text-[#64748b] file:mr-3 file:rounded-xl file:border-0 file:bg-[#eef8ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0099cc]"
                />
                {reportFile ? (
                  <div className="mt-2 text-xs font-medium text-emerald-600">
                    {t("modals.report.fileSelected")}: {reportFile.name}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportDialog(null);
                  setReportResponse("");
                  setReportFile(null);
                }}
                className="rounded-2xl border border-[#00BFFF]/15 px-4 py-2.5 text-sm font-semibold text-[#47637a]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFFF] to-[#0099cc] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Send className="size-4" />
                {t("actions.submitForReview")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {extensionDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => {
            setExtensionDialog(null);
            setExtensionNote("");
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="extension-dialog-title"
          >
            <h3 id="extension-dialog-title" className="text-xl font-semibold text-[#0f172a]">
              {t("attention.extendTitle")}
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">{t("attention.extendDescription")}</p>
            <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4 ring-1 ring-[#edf5fb]">
              <div className="text-sm font-semibold text-[#0f172a]">
                {getOrderText(extensionDialog, "title")}
              </div>
              <div className="mt-2 text-xs text-[#64748b]">
                {t("attention.currentDeadline")}:{" "}
                {formatDate(extensionDialog.deadline, locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="mt-2">
                <AttentionBadges item={extensionDialog} t={t} />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-[#0f172a]">{t("attention.newDeadline")}</label>
              <input
                type="date"
                value={extensionNewDeadline}
                onChange={(event) => setExtensionNewDeadline(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
              />
            </div>
            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-[#0f172a]">{t("attention.extendNote")}</label>
              <textarea
                value={extensionNote}
                onChange={(event) => setExtensionNote(event.target.value)}
                placeholder={t("attention.extendNotePlaceholder")}
                rows={3}
                className="w-full rounded-2xl border border-[#dbe5ef] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#0b74b8]/40 focus:ring-2 focus:ring-[#0b74b8]/10"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setExtensionDialog(null);
                  setExtensionNote("");
                }}
                className="rounded-2xl border border-[#dbe5ef] px-4 py-2.5 text-sm font-semibold text-[#47637a]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmExtension}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <CalendarClock className="size-4" />
                {t("attention.extendSubmit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[#0f172a]">{t("modals.review.title")}</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {reviewDialog.assigneeName} · {getSectorLabel(reviewDialog.sector)}
            </p>
            <div className="mt-3">
              <AttentionBadges item={reviewDialog} t={t} />
            </div>

            <div className="mt-5 rounded-3xl bg-[#f8fbff] p-4">
              <div className="text-sm font-semibold text-[#0f172a]">{getOrderText(reviewDialog, "title")}</div>
              <div className="mt-2 text-sm leading-6 text-[#475569]">{getOrderText(reviewDialog, "response")}</div>
              {reviewDialog.attachmentName ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0099cc]">
                  <FileText className="size-3.5" />
                  {reviewDialog.attachmentName}
                </div>
              ) : null}
              {reviewDialog.issuedPdfDataUrl && reviewDialog.issuedPdfName ? (
                <div className="mt-3">
                  <div className="text-xs font-medium text-[#64748b]">{t("registry.issuedPdf.sectionTitle")}</div>
                  <button
                    type="button"
                    onClick={() => downloadIssuedPdf(reviewDialog)}
                    className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#085f96] hover:underline"
                  >
                    <FileDown className="size-4" />
                    {reviewDialog.issuedPdfName}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-[#0f172a]">
                {t("modals.review.comment")}
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder={t("modals.review.commentPlaceholder")}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#00BFFF]/15 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/40 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewDialog(null);
                  setRejectReason("");
                }}
                className="rounded-2xl border border-[#00BFFF]/15 px-4 py-2.5 text-sm font-semibold text-[#47637a]"
              >
                {t("common.close")}
              </button>
              <button
                type="button"
                onClick={() => handleReview("returned")}
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                <RotateCcw className="size-4" />
                {t("actions.returnForRevision")}
              </button>
              <button
                type="button"
                onClick={() => handleReview("rejected")}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                <XCircle className="size-4" />
                {t("actions.reject")}
              </button>
              <button
                type="button"
                onClick={() => handleReview("approved")}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="size-4" />
                {t("actions.approve")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
