"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, User } from "lucide-react";

export type HierarchyNode = {
  id: string;
  name: string;
  title: string;
  sectors?: string[];
  children?: HierarchyNode[];
};

type HierarchyChartProps = {
  root: HierarchyNode;
  onUpdate: (root: HierarchyNode) => void;
  canEdit?: boolean;
};

function NodeCard({
  node,
  level,
  isExpanded,
  showChildrenToggle = true,
  onToggle,
  onAddChild,
  onAddSector,
  onUpdateName,
  onUpdateTitle,
  canEdit,
}: {
  node: HierarchyNode;
  level: number;
  isExpanded: boolean;
  showChildrenToggle?: boolean;
  onToggle: () => void;
  onAddChild: () => void;
  onAddSector?: () => void;
  onUpdateName: (name: string) => void;
  onUpdateTitle: (title: string) => void;
  canEdit: boolean;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isDeputy = level === 1;
  const isRoot = level === 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`group relative flex flex-col rounded-xl border bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(0,175,255,0.06)] transition-all hover:shadow-[0_4px_12px_rgba(0,175,255,0.1)] ${
          isRoot
            ? "min-w-[200px] max-w-[240px] border-[#00BFFF]/30 bg-[#00BFFF]/5 ring-1 ring-[#00BFFF]/20"
            : isDeputy
              ? "min-w-[140px] max-w-[180px] border-[#00BFFF]/15"
              : "min-w-[160px] max-w-[200px] border-[#00BFFF]/15"
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#00BFFF]/15">
            <User className="size-4 text-[#0099cc]" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={node.name}
              onChange={(e) => onUpdateName(e.target.value)}
              readOnly={!canEdit}
              className="w-full truncate border-0 bg-transparent p-0 text-sm font-semibold text-[#0a0a0f] outline-none focus:ring-0"
              placeholder="ФИО"
            />
            <input
              type="text"
              value={node.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              readOnly={!canEdit}
              className="mt-0.5 w-full truncate border-0 bg-transparent p-0 text-xs text-[#566a7f] outline-none focus:ring-0"
              placeholder="Должность"
            />
          </div>
        </div>

        {node.sectors && node.sectors.length > 0 && (
          <ul className="mt-2 space-y-0.5 border-t border-[#00BFFF]/10 pt-2 text-xs text-[#566a7f]">
            {node.sectors.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        )}

        {canEdit && (isRoot || isDeputy || level >= 1) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={onAddChild}
              className="flex items-center gap-1 rounded-lg bg-[#00BFFF]/10 px-2 py-1 text-xs font-medium text-[#0099cc] opacity-0 transition-opacity hover:bg-[#00BFFF]/20 group-hover:opacity-100"
            >
              <Plus className="size-3" />
              {isRoot ? "Добавить зам акима" : "Добавить подчинённого"}
            </button>
            {isDeputy && onAddSector && (
              <button
                type="button"
                onClick={onAddSector}
                className="flex items-center gap-1 rounded-lg bg-[#00BFFF]/10 px-2 py-1 text-xs font-medium text-[#0099cc] opacity-0 transition-opacity hover:bg-[#00BFFF]/20 group-hover:opacity-100"
              >
                <Plus className="size-3" />
                Направление
              </button>
            )}
          </div>
        )}

        {hasChildren && showChildrenToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 border-0 bg-transparent px-1 py-0 text-[10px] text-[#00BFFF]/60 hover:text-[#0099cc]"
          >
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            <span>{node.children!.length} подчинённых</span>
          </button>
        )}
      </div>
    </div>
  );
}

function updateNode(
  root: HierarchyNode,
  id: string,
  updater: (n: HierarchyNode) => HierarchyNode
): HierarchyNode {
  if (root.id === id) return updater(root);
  return {
    ...root,
    children: root.children?.map((c) => updateNode(c, id, updater)),
  };
}

export function HierarchyChart({
  root,
  onUpdate,
  canEdit = true,
}: HierarchyChartProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.id]));
  const [addDialog, setAddDialog] = useState<{
    parentId: string;
    type: "child" | "sector";
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSector, setNewSector] = useState("");

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddChild = (parentId: string) => {
    setAddDialog({ parentId, type: "child" });
    setNewName("");
    setNewTitle(
      parentId === "akim" ? "Зам. Акима Области Абай" : "Руководитель отдела"
    );
  };

  const handleAddSector = (parentId: string) => {
    setAddDialog({ parentId, type: "sector" });
    setNewSector("");
  };

  const submitAdd = () => {
    if (!addDialog) return;

    if (addDialog.type === "child") {
      if (!newName.trim()) return;
      const newNode: HierarchyNode = {
        id: `node-${Date.now()}`,
        name: newName.trim(),
        title: newTitle.trim() || "Руководитель",
        children: [],
      };
      const addChildTo = (n: HierarchyNode): HierarchyNode => {
        if (n.id === addDialog.parentId) {
          return {
            ...n,
            children: [...(n.children ?? []), newNode],
          };
        }
        return { ...n, children: n.children?.map(addChildTo) };
      };
      onUpdate(addChildTo(root));
      setExpanded((prev) => new Set([...prev, addDialog.parentId]));
    } else {
      if (!newSector.trim()) return;
      onUpdate(
        updateNode(root, addDialog.parentId, (n) => ({
          ...n,
          sectors: [...(n.sectors ?? []), newSector.trim()],
        }))
      );
    }

    setAddDialog(null);
    setNewName("");
    setNewTitle("");
    setNewSector("");
  };

  const departmentHeads = (root.children ?? []).flatMap((deputy) => deputy.children ?? []);

  const renderLevel = (
    node: HierarchyNode,
    level: number
  ): React.ReactNode => {
    const isExpanded = expanded.has(node.id);
    const isRoot = level === 0;
    const isDeputy = level === 1;

    return (
      <div
        key={node.id}
        className={`flex flex-col items-center gap-4 ${level === 1 ? "shrink-0" : ""}`}
      >
        <NodeCard
          node={node}
          level={level}
          isExpanded={isExpanded}
          showChildrenToggle={!isDeputy}
          onToggle={() => toggle(node.id)}
          onAddChild={() => handleAddChild(node.id)}
          onAddSector={level === 1 ? () => handleAddSector(node.id) : undefined}
          onUpdateName={(name) =>
            onUpdate(updateNode(root, node.id, (n) => ({ ...n, name })))
          }
          onUpdateTitle={(title) =>
            onUpdate(updateNode(root, node.id, (n) => ({ ...n, title })))
          }
          canEdit={canEdit}
        />

        {isRoot && node.children && node.children.length > 0 && isExpanded && (
          <>
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-px bg-[#00BFFF]/30" />
              <div
                className="h-px bg-[#00BFFF]/20"
                style={{
                  width: Math.max(
                    120,
                    (node.children.length - 1) * 100 + 180
                  ),
                }}
              />
            </div>
            <div
              className={`flex justify-center gap-4 py-2 ${
                level === 0 ? "flex-nowrap overflow-x-auto" : "flex-wrap"
              }`}
            >
              {node.children.map((child) => renderLevel(child, level + 1))}
            </div>

            {departmentHeads.length > 0 && (
              <div className="flex w-full flex-col items-center gap-3 pt-2">
                <div className="h-4 w-px bg-[#00BFFF]/20" />
                <div className="rounded-full bg-[#eef8ff] px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#0099cc]">
                  Руководители отдела
                </div>
                <div
                  className="h-px bg-[#00BFFF]/15"
                  style={{
                    width: Math.max(
                      180,
                      (departmentHeads.length - 1) * 110 + 190
                    ),
                  }}
                />
                <div className="flex flex-wrap justify-center gap-4 py-2">
                  {departmentHeads.map((child) => renderLevel(child, 2))}
                </div>
              </div>
            )}
          </>
        )}

        {!isRoot && !isDeputy && node.children && node.children.length > 0 && isExpanded && (
          <>
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-px bg-[#00BFFF]/30" />
              <div
                className="h-px bg-[#00BFFF]/20"
                style={{
                  width: Math.max(
                    120,
                    (node.children.length - 1) * 100 + 180
                  ),
                }}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-4 py-2">
              {node.children.map((child) => renderLevel(child, level + 1))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 overflow-x-auto py-4">
        {renderLevel(root, 0)}
      </div>

      {canEdit && addDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0a0a0f]">
              {addDialog.type === "child"
                ? "Добавить подчинённого"
                : "Добавить направление"}
            </h3>
            {addDialog.type === "child" ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#2f2b3d]">
                    ФИО
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Введите ФИО"
                    className="mt-1 w-full rounded-xl border border-[#00BFFF]/20 px-3 py-2 text-sm outline-none focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2f2b3d]">
                    Должность
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Руководитель отдела, директор..."
                    className="mt-1 w-full rounded-xl border border-[#00BFFF]/20 px-3 py-2 text-sm outline-none focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label className="text-sm font-medium text-[#2f2b3d]">
                  Направление
                </label>
                <input
                  type="text"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  placeholder="Экономика, Финансы..."
                  className="mt-1 w-full rounded-xl border border-[#00BFFF]/20 px-3 py-2 text-sm outline-none focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddDialog(null)}
                className="rounded-xl border border-[#00BFFF]/20 px-4 py-2 text-sm font-medium text-[#566a7f]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitAdd}
                className="rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#0099cc] px-4 py-2 text-sm font-semibold text-white"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
