import type { HierarchyNode, WorkspaceUser } from "@/shared/lib/app-users";
import {
  DEFAULT_HIERARCHY,
  HIERARCHY_STORAGE_KEY,
  HIERARCHY_TREE_SCHEMA_KEY,
  HIERARCHY_TREE_SCHEMA_VERSION,
  isAssigneeUnderManager,
  normalizeHierarchyNode,
} from "@/shared/lib/app-users";

/** Синхронно с `protocol-orders-page-client` */
export const PROTOCOL_ORDERS_STORAGE_KEY = "protocol-orders-items";

export const PROTOCOL_ORDERS_CHANGED_EVENT = "protocol-orders-changed";

type RawOrder = {
  status?: string;
  assigneeNodeId?: string;
  deputyId?: string;
  authorAccountId?: string;
  deadlineExtensionCount?: number;
};

function readHierarchyFromStorage(): HierarchyNode {
  if (typeof window === "undefined") return DEFAULT_HIERARCHY;
  try {
    const hVer = Number(window.localStorage.getItem(HIERARCHY_TREE_SCHEMA_KEY) ?? "0");
    if (hVer < HIERARCHY_TREE_SCHEMA_VERSION) {
      return DEFAULT_HIERARCHY;
    }
    const raw = window.localStorage.getItem(HIERARCHY_STORAGE_KEY);
    if (!raw) return DEFAULT_HIERARCHY;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return normalizeHierarchyNode(parsed as HierarchyNode);
    }
  } catch {
    // ignore
  }
  return DEFAULT_HIERARCHY;
}

export function parseProtocolOrdersFromStorage(): RawOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROTOCOL_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data as RawOrder[];
  } catch {
    return [];
  }
}

export function filterProtocolOrdersForUser(
  user: WorkspaceUser,
  items: RawOrder[],
): RawOrder[] {
  const hierarchy = readHierarchyFromStorage();

  if (user.role === "admin" || user.role === "akim") {
    return items;
  }

  if (user.role === "deputy" && user.nodeId) {
    const branchId = user.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === branchId ||
        item.deputyId === branchId ||
        item.authorAccountId === user.id ||
        (!!item.assigneeNodeId &&
          isAssigneeUnderManager(hierarchy, item.assigneeNodeId, branchId)),
    );
  }

  if (user.role === "department_head" && user.nodeId) {
    const headNodeId = user.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === headNodeId ||
        item.authorAccountId === user.id ||
        (!!item.assigneeNodeId &&
          isAssigneeUnderManager(hierarchy, item.assigneeNodeId, headNodeId)),
    );
  }

  if (user.role === "specialist" && user.nodeId) {
    const specNodeId = user.nodeId;
    return items.filter(
      (item) =>
        item.assigneeNodeId === specNodeId || item.authorAccountId === user.id,
    );
  }

  return [];
}

export function getProtocolTasksCompletionStats(user: WorkspaceUser): {
  completed: number;
  total: number;
} {
  const items = filterProtocolOrdersForUser(user, parseProtocolOrdersFromStorage());
  const total = items.length;
  const completed = items.filter((i) => i.status === "approved").length;
  return { completed, total };
}

export function getProtocolOrdersAttentionStats(user: WorkspaceUser): {
  extended: number;
  returned: number;
} {
  const items = filterProtocolOrdersForUser(user, parseProtocolOrdersFromStorage());
  return {
    extended: items.filter((i) => (Number(i.deadlineExtensionCount) || 0) > 0).length,
    returned: items.filter((i) => i.status === "returned").length,
  };
}
