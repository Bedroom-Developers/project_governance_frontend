"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  PlayCircle,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";

import { HierarchyChart } from "@/shared/components/hierarchy-chart/hierarchy-chart";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  canAssignProtocolOrders,
  canEditHierarchy,
  DEFAULT_HIERARCHY,
  findHierarchyNode,
  flattenHierarchy,
  getAssignablePeopleForUser,
  getRoleLabel,
  HIERARCHY_STORAGE_KEY,
  type HierarchyNode,
} from "@/shared/lib/app-users";
import { getClientAuthenticatedUser } from "@/shared/lib/auth";

const STORAGE_KEY_ORDERS = "protocol-orders-items";

type TaskStatus =
  | "new"
  | "in_progress"
  | "on_review"
  | "approved"
  | "rejected"
  | "returned";

type ProtocolOrder = {
  id: number;
  authorAccountId: string;
  authorNodeId?: string;
  authorName: string;
  assigneeNodeId: string;
  assigneeName: string;
  deputyId: string;
  sector: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  response?: string;
  attachmentName?: string;
  createdAt: string;
  rejectReason?: string;
  reviewByName?: string;
};

const INITIAL_ORDERS: ProtocolOrder[] = [
  {
    id: 101,
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "1",
    assigneeName: "Ербол Абилхайырулы Садыр",
    deputyId: "1",
    sector: "Экономика",
    title: "Подготовить отчёт по экономическим показателям за квартал",
    description: "Собрать данные по всем направлениям, срок до 15:00.",
    deadline: "2026-03-25",
    status: "on_review",
    response: "Отчёт подготовлен. Основные показатели в приложении.",
    attachmentName: "otchet_ekonomika_q1.pdf",
    createdAt: "2026-03-20",
    reviewByName: "Берик Уали",
  },
  {
    id: 102,
    authorAccountId: "akim-abai",
    authorNodeId: "akim",
    authorName: "Берик Уали",
    assigneeNodeId: "3",
    assigneeName: "Туленбергенов Серик Тулювгалиевич",
    deputyId: "3",
    sector: "ЖКХ",
    title: "Актуализировать план по модернизации водоснабжения",
    description: "Подготовить предложения по корректировке плана.",
    deadline: "2026-03-28",
    status: "in_progress",
    createdAt: "2026-03-19",
  },
  {
    id: 103,
    authorAccountId: "deputy-tulenbergenov",
    authorNodeId: "3",
    authorName: "Туленбергенов Серик Тулювгалиевич",
    assigneeNodeId: "3-1",
    assigneeName: "Камария Кажгалиева",
    deputyId: "3",
    sector: "ЖКХ",
    title: "Подготовить сводку по строительству спортивного комплекса",
    description: "Собрать статус по подрядчикам, срокам и рискам.",
    deadline: "2026-03-24",
    status: "new",
    createdAt: "2026-03-21",
  },
  {
    id: 104,
    authorAccountId: "deputy-bakpaev",
    authorNodeId: "2",
    authorName: "Эльдар Кусманулы Бакпаев",
    assigneeNodeId: "2-1",
    assigneeName: "Руслан Бекенулы Ахметов",
    deputyId: "2",
    sector: "Акимат (кадры, юристы)",
    title: "Подготовить правовое заключение по кадровой комиссии",
    description: "Согласовать пакет документов и приложить заключение в PDF.",
    deadline: "2026-03-26",
    status: "approved",
    response: "Заключение подготовлено и направлено на подпись.",
    attachmentName: "kadry_pravo.pdf",
    createdAt: "2026-03-18",
    reviewByName: "Эльдар Кусманулы Бакпаев",
  },
];

function getStatusLabel(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    new: "Новое",
    in_progress: "В работе",
    on_review: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
    returned: "На доработке",
  };
  return map[status] ?? status;
}

function getStatusClasses(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    new: "bg-[#00BFFF]/10 text-[#0099cc] ring-[#00BFFF]/30",
    in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
    on_review: "bg-violet-50 text-violet-700 ring-violet-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
    returned: "bg-orange-50 text-orange-700 ring-orange-600/20",
  };
  return map[status] ?? "bg-neutral-50 text-neutral-700";
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

function normalizeOrders(items: ProtocolOrder[]) {
  return items.map((item) => ({
    ...item,
    assigneeNodeId: item.assigneeNodeId ?? (item as ProtocolOrder & { assigneeId?: string }).assigneeId ?? "",
    authorAccountId:
      item.authorAccountId ??
      (item.authorName?.includes("Берик") || item.authorName?.includes("Аким")
        ? "akim-abai"
        : "admin"),
  }));
}

function getVisibleOrders(currentUser: WorkspaceUser, items: ProtocolOrder[]) {
  if (currentUser.role === "admin" || currentUser.role === "akim") {
    return items;
  }

  if (currentUser.role === "deputy" && currentUser.nodeId) {
    return items.filter(
      (item) =>
        item.assigneeNodeId === currentUser.nodeId ||
        item.deputyId === currentUser.nodeId ||
        item.authorAccountId === currentUser.id,
    );
  }

  if (currentUser.role === "department_head" && currentUser.nodeId) {
    return items.filter((item) => item.assigneeNodeId === currentUser.nodeId);
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

  return currentUser.role === "deputy" && item.authorAccountId === currentUser.id;
}

export function ProtocolOrdersPageClient() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyNode>(DEFAULT_HIERARCHY);
  const [items, setItems] = useState<ProtocolOrder[]>(INITIAL_ORDERS);
  const [assigneeId, setAssigneeId] = useState("");
  const [sector, setSector] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hierarchyOpen, setHierarchyOpen] = useState(true);
  const [reportDialog, setReportDialog] = useState<ProtocolOrder | null>(null);
  const [reportResponse, setReportResponse] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reviewDialog, setReviewDialog] = useState<ProtocolOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setHierarchy(loadFromStorage(HIERARCHY_STORAGE_KEY, DEFAULT_HIERARCHY));
    setItems(normalizeOrders(loadFromStorage(STORAGE_KEY_ORDERS, INITIAL_ORDERS)));
    setCurrentUser(getClientAuthenticatedUser());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(HIERARCHY_STORAGE_KEY, hierarchy);
  }, [hierarchy, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEY_ORDERS, items);
  }, [items, isHydrated]);

  const assignablePeople = useMemo(
    () => (currentUser ? getAssignablePeopleForUser(currentUser, hierarchy) : []),
    [currentUser, hierarchy],
  );

  const visibleItems = useMemo(
    () => (currentUser ? getVisibleOrders(currentUser, items) : []),
    [currentUser, items],
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

  const stats = {
    submitted: visibleItems.filter((i) => i.status === "on_review").length,
    executed: visibleItems.filter((i) => i.status === "approved").length,
    inProgress: visibleItems.filter((i) =>
      ["new", "in_progress", "returned"].includes(i.status),
    ).length,
    notExecuted: visibleItems.filter((i) => i.status === "rejected").length,
  };

  const canCreateOrders = currentUser
    ? canAssignProtocolOrders(currentUser.role)
    : false;

  const handleCreateOrder = () => {
    if (!currentUser || !canCreateOrders) return;

    const person = assignablePeople.find((p) => p.id === assigneeId);
    if (!person || !sector || !title.trim() || !deadline) return;

    const newOrder: ProtocolOrder = {
      id: Date.now(),
      authorAccountId: currentUser.id,
      authorNodeId: currentUser.nodeId,
      authorName: currentUser.name,
      assigneeNodeId: person.id,
      assigneeName: person.name,
      deputyId:
        currentUser.role === "deputy"
          ? currentUser.nodeId ?? person.parentId ?? person.id
          : person.parentId ?? person.id,
      sector,
      title: title.trim(),
      description: description.trim(),
      deadline,
      status: "new",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setItems((prev) => [newOrder, ...prev]);
    setAssigneeId("");
    setSector("");
    setTitle("");
    setDescription("");
    setDeadline("");
  };

  const handleStartWork = (orderId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === orderId && item.status === "new"
          ? { ...item, status: "in_progress" as TaskStatus }
          : item,
      ),
    );
  };

  const handleSubmitReport = () => {
    if (!reportDialog) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === reportDialog.id
          ? {
              ...item,
              status: "on_review" as TaskStatus,
              response: reportResponse,
              attachmentName: reportFile?.name ?? item.attachmentName,
            }
          : item,
      ),
    );
    setReportDialog(null);
    setReportResponse("");
    setReportFile(null);
  };

  const handleReview = (action: "approved" | "rejected" | "returned") => {
    if (!reviewDialog || !currentUser) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === reviewDialog.id
          ? {
              ...item,
              status: action,
              rejectReason:
                action === "rejected" || action === "returned"
                  ? rejectReason
                  : undefined,
              reviewByName: currentUser.name,
            }
          : item,
      ),
    );
    setReviewDialog(null);
    setRejectReason("");
  };

  const onAssigneeChange = (id: string) => {
    setAssigneeId(id);
    setSector("");
  };

  if (!isHydrated || !currentUser) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0f]">
            Протокольные поручения
          </h1>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,175,255,0.08)]">
          <div className="h-12 animate-pulse rounded-xl bg-[#eef8ff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0f]">
          Протокольные поручения
        </h1>
        <div className="mt-1 text-sm text-[#566a7f]">
          Иерархия управления: Аким → Замы акима → Руководители отдела → Контроль исполнения.
        </div>
        <div className="mt-2 inline-flex rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-semibold text-[#0099cc]">
          Сейчас вы вошли как {currentUser.name} — {getRoleLabel(currentUser.role)}
        </div>
      </div>

      <div
        className="animate-fade-in-up grid grid-cols-2 gap-3 sm:grid-cols-4"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="rounded-xl border border-[#00BFFF]/15 bg-white p-4 shadow-[0_2px_12px_rgba(0,175,255,0.06)]">
          <div className="text-2xl font-bold text-violet-600">{stats.submitted}</div>
          <div className="text-xs font-medium text-[#566a7f]">На проверке</div>
        </div>
        <div className="rounded-xl border border-[#00BFFF]/15 bg-white p-4 shadow-[0_2px_12px_rgba(0,175,255,0.06)]">
          <div className="text-2xl font-bold text-emerald-600">{stats.executed}</div>
          <div className="text-xs font-medium text-[#566a7f]">Исполнено</div>
        </div>
        <div className="rounded-xl border border-[#00BFFF]/15 bg-white p-4 shadow-[0_2px_12px_rgba(0,175,255,0.06)]">
          <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          <div className="text-xs font-medium text-[#566a7f]">На исполнении</div>
        </div>
        <div className="rounded-xl border border-[#00BFFF]/15 bg-white p-4 shadow-[0_2px_12px_rgba(0,175,255,0.06)]">
          <div className="text-2xl font-bold text-rose-600">{stats.notExecuted}</div>
          <div className="text-xs font-medium text-[#566a7f]">Не исполнено</div>
        </div>
      </div>

      <div
        className="animate-fade-in-up overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,175,255,0.08)]"
        style={{ animationDelay: "0.08s" }}
      >
        <button
          type="button"
          onClick={() => setHierarchyOpen(!hierarchyOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#f8fcff]/50"
        >
          <span className="font-semibold text-[#0a0a0f]">
            Иерархия: Аким → Замы акима → Руководители отделов
          </span>
          {hierarchyOpen ? (
            <ChevronDown className="size-5 text-[#566a7f]" />
          ) : (
            <ChevronRight className="size-5 text-[#566a7f]" />
          )}
        </button>
        {hierarchyOpen && (
          <div className="border-t border-[#00BFFF]/10 px-5 py-4">
            <HierarchyChart
              root={hierarchy}
              onUpdate={setHierarchy}
              canEdit={canEditHierarchy(currentUser.role)}
            />
          </div>
        )}
      </div>

      <div
        className="animate-fade-in-up rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,175,255,0.08)]"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#0a0a0f]">
            Выдать поручение
          </h2>
          <div className="mt-0.5 text-sm text-[#566a7f]">
            {canCreateOrders
              ? "Назначайте поручения по своей зоне ответственности и контролируйте отчёты."
              : "В этом профиле можно исполнять поручения, но нельзя выдавать новые."}
          </div>
        </div>

        {canCreateOrders ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Кому назначить
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                >
                  <option value="">Выберите исполнителя</option>
                  {assignablePeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Направление
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                >
                  <option value="">Выберите направление</option>
                  {sectorsForAssignee.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2f2b3d]">Срок</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Заголовок поручения
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите краткое название поручения"
                  className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите детали поручения"
                  rows={3}
                  className="w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCreateOrder}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#0099cc] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,175,255,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_28px_rgba(0,175,255,0.5)]"
              >
                <Send className="size-4" />
                Выдать поручение
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div
        className="animate-fade-in-up overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,175,255,0.08)]"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#00BFFF]/10 text-sm">
            <thead className="bg-[#f8fcff]">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#566a7f]">
                  Автор / Исполнитель
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#566a7f]">
                  Поручение
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#566a7f]">
                  Срок
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#566a7f]">
                  Статус
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#566a7f]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00BFFF]/5 bg-white">
              {visibleItems.map((item) => (
                <tr
                  key={item.id}
                  className="align-top transition-colors hover:bg-[#f8fcff]/50"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[#0a0a0f]">
                      {item.assigneeName}
                    </div>
                    <div className="text-xs text-[#566a7f]">{item.sector}</div>
                    <div className="mt-1 text-xs text-[#94a3b8]">
                      Поставил: {item.authorName}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[#0a0a0f]">{item.title}</div>
                    <div className="mt-0.5 text-sm text-[#566a7f]">
                      {item.description}
                    </div>
                    {item.response ? (
                      <div className="mt-2 rounded-lg bg-[#f8fcff] px-2 py-1.5 text-xs">
                        <span className="font-medium text-[#566a7f]">Ответ:</span>{" "}
                        {item.response}
                      </div>
                    ) : null}
                    {item.attachmentName ? (
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#0099cc]">
                        <FileText className="size-3" />
                        {item.attachmentName}
                      </div>
                    ) : null}
                    {item.rejectReason ? (
                      <div className="mt-1 text-xs text-rose-600">
                        Причина: {item.rejectReason}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-[#566a7f]">{item.deadline}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {currentUser.nodeId === item.assigneeNodeId &&
                      item.status === "new" ? (
                        <button
                          type="button"
                          onClick={() => handleStartWork(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          <PlayCircle className="size-3" />
                          Взять в работу
                        </button>
                      ) : null}
                      {canSubmitOrder(currentUser, item) ? (
                        <button
                          type="button"
                          onClick={() => setReportDialog(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#00BFFF]/30 bg-[#00BFFF]/5 px-2.5 py-1 text-xs font-medium text-[#0099cc] hover:bg-[#00BFFF]/10"
                        >
                          <Send className="size-3" />
                          Отправить на проверку
                        </button>
                      ) : null}
                      {canReviewOrder(currentUser, item) ? (
                        <button
                          type="button"
                          onClick={() => setReviewDialog(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                        >
                          Проверить
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-[#94a3b8]"
                  >
                    Для этого профиля пока нет поручений
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {reportDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0a0a0f]">
              Отправить отчёт на проверку
            </h3>
            <p className="mt-1 text-sm text-[#566a7f]">
              Поручение: {reportDialog.title}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Ответ / Отчёт
                </label>
                <textarea
                  value={reportResponse}
                  onChange={(e) => setReportResponse(e.target.value)}
                  placeholder="Опишите выполненную работу..."
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Приложение (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-sm text-[#566a7f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#00BFFF]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#0099cc]"
                />
                {reportFile ? (
                  <p className="mt-1 text-xs text-emerald-600">
                    Выбран: {reportFile.name}
                  </p>
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
                className="rounded-xl border border-[#00BFFF]/20 px-4 py-2 text-sm font-medium text-[#566a7f] hover:bg-[#f8fcff]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#0099cc] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,175,255,0.35)] hover:shadow-[0_6px_20px_rgba(0,175,255,0.4)]"
              >
                <Send className="size-4" />
                Отправить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0a0a0f]">
              Проверка отчёта
            </h3>
            <p className="mt-1 text-sm text-[#566a7f]">
              {reviewDialog.assigneeName} — {reviewDialog.sector}
            </p>
            <div className="mt-4 space-y-3 rounded-xl bg-[#f8fcff] p-4">
              <div>
                <span className="text-xs font-medium text-[#566a7f]">
                  Поручение
                </span>
                <p className="mt-0.5 font-medium text-[#0a0a0f]">
                  {reviewDialog.title}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-[#566a7f]">Ответ</span>
                <p className="mt-0.5 text-sm text-[#0a0a0f]">
                  {reviewDialog.response}
                </p>
              </div>
              {reviewDialog.attachmentName ? (
                <div className="flex items-center gap-2 text-sm text-[#0099cc]">
                  <FileText className="size-4" />
                  {reviewDialog.attachmentName}
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-[#2f2b3d]">
                Причина отклонения / доработки
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Укажите причину..."
                className="mt-1.5 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewDialog(null);
                  setRejectReason("");
                }}
                className="rounded-xl border border-[#00BFFF]/20 px-4 py-2 text-sm font-medium text-[#566a7f] hover:bg-[#f8fcff]"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => handleReview("returned")}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
              >
                <RotateCcw className="size-4" />
                На доработку
              </button>
              <button
                type="button"
                onClick={() => handleReview("rejected")}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <XCircle className="size-4" />
                Отклонить
              </button>
              <button
                type="button"
                onClick={() => handleReview("approved")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(5,150,105,0.3)] hover:bg-emerald-700"
              >
                <CheckCircle2 className="size-4" />
                Одобрить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
