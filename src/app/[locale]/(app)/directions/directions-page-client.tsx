"use client";

import { ChevronDown, ChevronRight, Plus, Save } from "lucide-react";
import * as React from "react";
import { useTranslations } from "next-intl";

import { type Direction, DirectionsGrid } from "@/modules/directions";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  canDeleteDirections,
  canManageDirections,
  DEFAULT_HIERARCHY,
  getAvailableDirectionExecutors,
  getCreatableDirectionAuthors,
  HIERARCHY_STORAGE_KEY,
  type HierarchyNode,
} from "@/shared/lib/app-users";
import { getClientAuthenticatedUser } from "@/shared/lib/auth";
import {
  computeDirectionStats,
  DEFAULT_DIRECTIONS,
  DEFAULT_GROUPS,
  DEFAULT_PROJECTS,
  DIRECTIONS_STORAGE_KEY,
  GROUPS_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  loadFromStorage,
  saveToStorage,
  type GroupsByDirection,
  type ProjectsByGroupKey,
} from "@/shared/lib/directions-storage";

export function DirectionsPageClient() {
  const t = useTranslations("directionsManage");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<WorkspaceUser | null>(null);
  const [directions, setDirections] =
    React.useState<Direction[]>(DEFAULT_DIRECTIONS);
  const [groupsByDirection, setGroupsByDirection] =
    React.useState<GroupsByDirection>(DEFAULT_GROUPS);
  const [projectsByGroupKey, setProjectsByGroupKey] =
    React.useState<ProjectsByGroupKey>(DEFAULT_PROJECTS);
  const [hierarchy, setHierarchy] =
    React.useState<HierarchyNode>(DEFAULT_HIERARCHY);
  const hydratedDirections = React.useMemo(
    () => computeDirectionStats(directions, groupsByDirection, projectsByGroupKey),
    [directions, groupsByDirection, projectsByGroupKey],
  );
  const creators = React.useMemo(
    () =>
      currentUser ? getCreatableDirectionAuthors(currentUser, hierarchy) : [],
    [currentUser, hierarchy],
  );
  const executors = React.useMemo(
    () => getAvailableDirectionExecutors(hierarchy),
    [hierarchy],
  );
  const canCreateDirections = currentUser
    ? canManageDirections(currentUser.role)
    : false;
  const canRemoveDirections = currentUser
    ? canDeleteDirections(currentUser.role)
    : false;

  const [directionName, setDirectionName] = React.useState("");
  const [creatorId, setCreatorId] = React.useState("");
  const [executorId, setExecutorId] = React.useState("");
  const [taskNote, setTaskNote] = React.useState(
    "Заполнить паспорт проекта и внести всю базовую информацию",
  );
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setDirections(loadFromStorage(DIRECTIONS_STORAGE_KEY, DEFAULT_DIRECTIONS));
    setGroupsByDirection(loadFromStorage(GROUPS_STORAGE_KEY, DEFAULT_GROUPS));
    setProjectsByGroupKey(loadFromStorage(PROJECTS_STORAGE_KEY, DEFAULT_PROJECTS));
    setHierarchy(loadFromStorage(HIERARCHY_STORAGE_KEY, DEFAULT_HIERARCHY));
    setCurrentUser(getClientAuthenticatedUser());
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (currentUser?.nodeId && currentUser.role !== "admin") {
      setCreatorId(currentUser.nodeId);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(DIRECTIONS_STORAGE_KEY, directions);
  }, [directions, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(GROUPS_STORAGE_KEY, groupsByDirection);
  }, [groupsByDirection, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(PROJECTS_STORAGE_KEY, projectsByGroupKey);
  }, [projectsByGroupKey, isHydrated]);

  const handleCreateDirection = () => {
    if (!currentUser || !canCreateDirections) return;

    const creator = creators.find((item) => item.id === creatorId);
    const executor = executors.find((item) => item.id === executorId);

    if (!directionName.trim() || !creator || !executor) return;

    const newDirection: Direction = {
      id: `direction-${Date.now()}`,
      name: directionName.trim(),
      ownerName: executor.name,
      createdByName: creator.name,
      passportResponsibleName: executor.name,
      passportResponsibleTitle: executor.title,
      passportTaskNote: taskNote.trim(),
      projectGroupsCount: 0,
      projectsCount: 0,
    };

    setDirections((prev) => [newDirection, ...prev]);
    setDirectionName("");
    setCreatorId(currentUser.role === "admin" ? "" : (currentUser.nodeId ?? ""));
    setExecutorId("");
    setTaskNote("Заполнить паспорт проекта и внести всю базовую информацию");
    setIsCreateOpen(false);
  };

  const handleDeleteDirection = React.useCallback(
    (directionId: string) => {
      if (!canRemoveDirections) return;

      const directionToDelete = directions.find((item) => item.id === directionId);
      if (!directionToDelete) return;

      const isConfirmed = window.confirm(
        `Удалить направление "${directionToDelete.name}"? Все его группы и проекты тоже будут удалены.`,
      );
      if (!isConfirmed) return;

      setDirections((prev) => prev.filter((item) => item.id !== directionId));
      setGroupsByDirection((prev) => {
        const next = { ...prev };
        const groups = next[directionId] ?? [];
        delete next[directionId];

        setProjectsByGroupKey((currentProjects) => {
          const nextProjects = { ...currentProjects };
          for (const group of groups) {
            delete nextProjects[`${directionId}-${group.id}`];
          }
          return nextProjects;
        });

        return next;
      });
    },
    [canRemoveDirections, directions],
  );

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
            {t("title")}
          </h1>
        </div>
        <div className="rounded-lg border border-[#dbe5ef] bg-white p-5">
          <div className="h-10 animate-pulse rounded-md bg-[#edf3f8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
          {t("title")}
        </h1>
        <div className="mt-1 text-sm text-[#5f6f81]">
          {t("subtitle")}
        </div>
        {currentUser ? (
          <div className="mt-2 inline-flex rounded-full bg-[#edf3f8] px-3 py-1 text-xs font-semibold text-[#085f96]">
            Текущий профиль: {currentUser.name} — {currentUser.title}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-[#dbe5ef] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-[#0b74b8]" />
            <h2 className="text-base font-semibold text-[#0f172a]">
              {t("createTitle")}
            </h2>
          </div>
          {canCreateDirections ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md border border-[#dbe5ef] bg-[#f5f8fb] px-4 py-2 text-sm font-medium text-[#085f96] transition hover:bg-[#ebf1f6]"
            >
              {isCreateOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {t("toggleCreate")}
            </button>
          ) : (
            <div className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              Руководитель отдела не может создавать направления
            </div>
          )}
        </div>

        {isCreateOpen && canCreateDirections ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  {t("fields.name")}
                </label>
                <input
                  type="text"
                  value={directionName}
                  onChange={(event) => setDirectionName(event.target.value)}
                  placeholder={t("placeholders.name")}
                  className="h-10 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  {t("fields.creator")}
                </label>
                <select
                  value={creatorId}
                  onChange={(event) => setCreatorId(event.target.value)}
                  disabled={currentUser?.role !== "admin"}
                  className="h-10 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
                >
                  <option value="">{t("placeholders.creator")}</option>
                  {creators.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  {t("fields.executor")}
                </label>
                <select
                  value={executorId}
                  onChange={(event) => setExecutorId(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
                >
                  <option value="">{t("placeholders.executor")}</option>
                  {executors.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  {t("fields.task")}
                </label>
                <textarea
                  value={taskNote}
                  onChange={(event) => setTaskNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-[#dbe5ef] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCreateDirection}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0b74b8] px-5 text-sm font-semibold text-white transition hover:bg-[#085f96]"
              >
                <Save className="size-4" />
                {t("save")}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <DirectionsGrid
        directions={hydratedDirections}
        canDelete={canRemoveDirections}
        onDelete={handleDeleteDirection}
      />
    </div>
  );
}
