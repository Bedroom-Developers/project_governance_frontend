"use client";

import { ChevronDown, ChevronRight, Plus, Save } from "lucide-react";
import * as React from "react";
import { useTranslations } from "next-intl";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { ProjectGroupsTable } from "@/modules/directions/ui/widgets/project-groups-table/project-groups-table";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  canDeleteGroups,
  canManageGroups,
  DEFAULT_HIERARCHY,
  getAvailableProjectOwners,
  HIERARCHY_STORAGE_KEY,
  type HierarchyNode,
} from "@/shared/lib/app-users";
import { getClientAuthenticatedUser } from "@/shared/lib/auth";
import {
  DEFAULT_GROUPS,
  GROUPS_STORAGE_KEY,
  loadFromStorage,
  PROJECTS_STORAGE_KEY,
  saveToStorage,
  type GroupsByDirection,
  type ProjectsByGroupKey,
  DEFAULT_PROJECTS,
} from "@/shared/lib/directions-storage";

export function GroupsPageClient({ directionId }: { directionId: string }) {
  const t = useTranslations("groupsPage");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<WorkspaceUser | null>(null);
  const [groupsByDirection, setGroupsByDirection] =
    React.useState<GroupsByDirection>(DEFAULT_GROUPS);
  const [projectsByGroupKey, setProjectsByGroupKey] =
    React.useState<ProjectsByGroupKey>(DEFAULT_PROJECTS);
  const [hierarchy, setHierarchy] =
    React.useState<HierarchyNode>(DEFAULT_HIERARCHY);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [groupName, setGroupName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");

  const groups = React.useMemo(
    () =>
      (groupsByDirection[directionId] ?? []).map((group) => ({
        ...group,
        projectsCount:
          projectsByGroupKey[`${directionId}-${group.id}`]?.length ?? 0,
      })),
    [directionId, groupsByDirection, projectsByGroupKey],
  );
  const people = React.useMemo(
    () =>
      currentUser ? getAvailableProjectOwners(currentUser, hierarchy) : [],
    [currentUser, hierarchy],
  );
  const canCreateGroups = currentUser ? canManageGroups(currentUser.role) : false;
  const canRemoveGroups = currentUser ? canDeleteGroups(currentUser.role) : false;

  React.useEffect(() => {
    setGroupsByDirection(loadFromStorage(GROUPS_STORAGE_KEY, DEFAULT_GROUPS));
    setProjectsByGroupKey(loadFromStorage(PROJECTS_STORAGE_KEY, DEFAULT_PROJECTS));
    setHierarchy(loadFromStorage(HIERARCHY_STORAGE_KEY, DEFAULT_HIERARCHY));
    setCurrentUser(getClientAuthenticatedUser());
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(GROUPS_STORAGE_KEY, groupsByDirection);
  }, [groupsByDirection, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(PROJECTS_STORAGE_KEY, projectsByGroupKey);
  }, [projectsByGroupKey, isHydrated]);

  const handleCreateGroup = () => {
    if (!canCreateGroups) return;
    if (!groupName.trim() || !ownerName.trim()) return;

    const nextId =
      Math.max(660, ...groups.map((group) => Number(group.id) || 0)) + 1;
    const newGroup: ProjectGroup = {
      id: nextId,
      name: groupName.trim(),
      ownerName: ownerName.trim(),
      projectsCount: 0,
    };

    setGroupsByDirection((prev) => ({
      ...prev,
      [directionId]: [newGroup, ...(prev[directionId] ?? [])],
    }));
    setGroupName("");
    setOwnerName("");
    setIsCreateOpen(false);
  };

  const handleDeleteGroup = React.useCallback(
    (groupId: number) => {
      if (!canRemoveGroups) return;

      const groupToDelete = groups.find((item) => item.id === groupId);
      if (!groupToDelete) return;

      const isConfirmed = window.confirm(
        `Удалить группу "${groupToDelete.name}"? Все проекты внутри нее тоже будут удалены.`,
      );
      if (!isConfirmed) return;

      setGroupsByDirection((prev) => ({
        ...prev,
        [directionId]: (prev[directionId] ?? []).filter((item) => item.id !== groupId),
      }));
      setProjectsByGroupKey((prev) => {
        const next = { ...prev };
        delete next[`${directionId}-${groupId}`];
        return next;
      });
    },
    [canRemoveGroups, directionId, groups],
  );

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
          {t("title")}
        </h1>
        <div className="rounded-lg border border-[#dbe5ef] bg-white p-5">
          <div className="h-10 animate-pulse rounded-md bg-[#edf3f8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
          {t("title")}
        </h1>
        {canCreateGroups ? (
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
            Руководитель отдела не может создавать группы проектов
          </div>
        )}
      </div>

      {isCreateOpen && canCreateGroups ? (
        <div className="rounded-lg border border-[#dbe5ef] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="size-4 text-[#0b74b8]" />
            <h2 className="text-base font-semibold text-[#0f172a]">
              {t("createTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">
                {t("fields.name")}
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={t("placeholders.name")}
                className="h-10 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">
                {t("fields.owner")}
              </label>
              <select
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className="h-10 w-full rounded-md border border-[#dbe5ef] bg-white px-3 text-sm outline-none transition focus:border-[#0b74b8]/45 focus:ring-2 focus:ring-[#0b74b8]/10"
              >
                <option value="">{t("placeholders.owner")}</option>
                {people.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name} — {person.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleCreateGroup}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0b74b8] px-5 text-sm font-semibold text-white transition hover:bg-[#085f96]"
            >
              <Save className="size-4" />
              {t("save")}
            </button>
          </div>
        </div>
      ) : null}

      <ProjectGroupsTable
        groups={groups}
        directionId={directionId}
        canDelete={canRemoveGroups}
        onDelete={handleDeleteGroup}
      />
    </div>
  );
}
