export type HierarchyNode = {
  id: string;
  name: string;
  title: string;
  sectors?: string[];
  children?: HierarchyNode[];
};

export type WorkspaceRole =
  | "admin"
  | "akim"
  | "deputy"
  | "department_head";

export type WorkspaceUser = {
  id: string;
  login: string;
  password: string;
  name: string;
  title: string;
  role: WorkspaceRole;
  nodeId?: string;
  organization: string;
  department: string;
  position: string;
  specialization: string;
  email: string;
  phone: string;
};

export type HierarchyPerson = {
  id: string;
  name: string;
  title: string;
  sectors: string[];
  parentId: string | null;
  depth: number;
};

export const HIERARCHY_STORAGE_KEY = "protocol-orders-hierarchy";

export const DEFAULT_HIERARCHY: HierarchyNode = {
  id: "akim",
  name: "Берик Уали",
  title: "Аким Области Абай",
  children: [
    {
      id: "1",
      name: "Ербол Абилхайырулы Садыр",
      title: "Зам. Акима Области Абай",
      sectors: ["Экономика", "Финансы", "Гос заказы"],
      children: [
        {
          id: "1-1",
          name: "Айдана Сериккызы Кайратова",
          title: "Руководитель отдела экономики и финансов",
          children: [],
        },
      ],
    },
    {
      id: "2",
      name: "Эльдар Кусманулы Бакпаев",
      title: "Зам. Акима Области Абай",
      sectors: ["Акимы", "Акимат (кадры, юристы)"],
      children: [
        {
          id: "2-1",
          name: "Руслан Бекенулы Ахметов",
          title: "Руководитель отдела кадров и правового обеспечения",
          children: [],
        },
      ],
    },
    {
      id: "3",
      name: "Туленбергенов Серик Тулювгалиевич",
      title: "Зам. Акима Области Абай",
      sectors: ["ЖКХ", "Дороги"],
      children: [
        {
          id: "3-1",
          name: "Камария Кажгалиева",
          title: "Руководитель отдела строительства и ЖКХ",
          children: [],
        },
      ],
    },
    {
      id: "4",
      name: "Думан Рыспекович Оспанов",
      title: "Зам. Акима Области Абай",
      sectors: ["Ветеринария", "УСХ"],
      children: [
        {
          id: "4-1",
          name: "Нурбек Жандосулы Нургалиев",
          title: "Руководитель отдела ветеринарии и сельского хозяйства",
          children: [],
        },
      ],
    },
    {
      id: "5",
      name: "Раханов Мейрлан Акылбекович",
      title: "Зам. Акима Области Абай",
      sectors: ["Культура", "УВП"],
      children: [
        {
          id: "5-1",
          name: "Айсулу Ермековна Тлеубекова",
          title: "Руководитель отдела культуры и внутренней политики",
          children: [],
        },
      ],
    },
  ],
};

export const WORKSPACE_USERS: WorkspaceUser[] = [
  {
    id: "admin",
    login: "admin",
    password: "admin123",
    name: "Системный администратор",
    title: "Администратор платформы",
    role: "admin",
    organization: "Abai Digital Projects",
    department: "Цифровая платформа",
    position: "Администратор системы",
    specialization: "Управление доступами и настройками платформы",
    email: "admin@abai-digital.local",
    phone: "+7 (700) 000-00-01",
  },
  {
    id: "akim-abai",
    login: "akim",
    password: "akim123",
    name: "Берик Уали",
    title: "Аким Области Абай",
    role: "akim",
    nodeId: "akim",
    organization: "Аппарат акима области Абай",
    department: "Руководство области",
    position: "Аким области",
    specialization: "Общее управление проектами и протокольными поручениями",
    email: "berik.uali@akimat.gov.kz",
    phone: "+7 (701) 000-00-02",
  },
  {
    id: "deputy-sadyr",
    login: "sadyr",
    password: "sadyr123",
    name: "Ербол Абилхайырулы Садыр",
    title: "Зам. Акима Области Абай",
    role: "deputy",
    nodeId: "1",
    organization: "Аппарат акима области Абай",
    department: "Экономика, финансы и госзаказы",
    position: "Заместитель акима области",
    specialization: "Экономический блок и государственные закупки",
    email: "e.sadyr@akimat.gov.kz",
    phone: "+7 (701) 000-00-03",
  },
  {
    id: "deputy-bakpaev",
    login: "bakpaev",
    password: "bakpaev123",
    name: "Эльдар Кусманулы Бакпаев",
    title: "Зам. Акима Области Абай",
    role: "deputy",
    nodeId: "2",
    organization: "Аппарат акима области Абай",
    department: "Кадры, юристы и взаимодействие с акиматами",
    position: "Заместитель акима области",
    specialization: "Оргвопросы, кадры и правовое сопровождение",
    email: "e.bakpaev@akimat.gov.kz",
    phone: "+7 (701) 000-00-04",
  },
  {
    id: "deputy-tulenbergenov",
    login: "tulenbergenov",
    password: "tulenbergenov123",
    name: "Туленбергенов Серик Тулювгалиевич",
    title: "Зам. Акима Области Абай",
    role: "deputy",
    nodeId: "3",
    organization: "Аппарат акима области Абай",
    department: "ЖКХ и дороги",
    position: "Заместитель акима области",
    specialization: "Инфраструктура, строительство и дорожная сеть",
    email: "s.tulenbergenov@akimat.gov.kz",
    phone: "+7 (701) 000-00-05",
  },
  {
    id: "deputy-ospanov",
    login: "ospanov",
    password: "ospanov123",
    name: "Думан Рыспекович Оспанов",
    title: "Зам. Акима Области Абай",
    role: "deputy",
    nodeId: "4",
    organization: "Аппарат акима области Абай",
    department: "Ветеринария и УСХ",
    position: "Заместитель акима области",
    specialization: "Сельское хозяйство и ветеринарный контроль",
    email: "d.ospanov@akimat.gov.kz",
    phone: "+7 (701) 000-00-06",
  },
  {
    id: "deputy-rakhanov",
    login: "rakhanov",
    password: "rakhanov123",
    name: "Раханов Мейрлан Акылбекович",
    title: "Зам. Акима Области Абай",
    role: "deputy",
    nodeId: "5",
    organization: "Аппарат акима области Абай",
    department: "Культура и УВП",
    position: "Заместитель акима области",
    specialization: "Культура и внутренняя политика",
    email: "m.rakhanov@akimat.gov.kz",
    phone: "+7 (701) 000-00-07",
  },
  {
    id: "director-kairatova",
    login: "kairatova",
    password: "kairatova123",
    name: "Айдана Сериккызы Кайратова",
    title: "Руководитель отдела экономики и финансов",
    role: "department_head",
    nodeId: "1-1",
    organization: "Аппарат акима области Абай",
    department: "Отдел экономики и финансов",
    position: "Руководитель отдела",
    specialization: "Планирование, экономический анализ, бюджетирование",
    email: "a.kairatova@akimat.gov.kz",
    phone: "+7 (701) 000-00-08",
  },
  {
    id: "director-akhmetov",
    login: "akhmetov",
    password: "akhmetov123",
    name: "Руслан Бекенулы Ахметов",
    title: "Руководитель отдела кадров и правового обеспечения",
    role: "department_head",
    nodeId: "2-1",
    organization: "Аппарат акима области Абай",
    department: "Отдел кадров и правового обеспечения",
    position: "Руководитель отдела",
    specialization: "Кадровая работа и юридическое сопровождение",
    email: "r.akhmetov@akimat.gov.kz",
    phone: "+7 (701) 000-00-09",
  },
  {
    id: "director-kazhgaliyeva",
    login: "kazhgaliyeva",
    password: "kazhgaliyeva123",
    name: "Камария Кажгалиева",
    title: "Руководитель отдела строительства и ЖКХ",
    role: "department_head",
    nodeId: "3-1",
    organization: "Аппарат акима области Абай",
    department: "Отдел строительства и ЖКХ",
    position: "Руководитель отдела",
    specialization: "Строительство, ЖКХ и проектная координация",
    email: "k.kazhgaliyeva@akimat.gov.kz",
    phone: "+7 (701) 000-00-10",
  },
  {
    id: "director-nurgaliev",
    login: "nurgaliev",
    password: "nurgaliev123",
    name: "Нурбек Жандосулы Нургалиев",
    title: "Руководитель отдела ветеринарии и сельского хозяйства",
    role: "department_head",
    nodeId: "4-1",
    organization: "Аппарат акима области Абай",
    department: "Отдел ветеринарии и сельского хозяйства",
    position: "Руководитель отдела",
    specialization: "Ветеринария и агропромышленный сектор",
    email: "n.nurgaliev@akimat.gov.kz",
    phone: "+7 (701) 000-00-11",
  },
  {
    id: "director-tleubekova",
    login: "tleubekova",
    password: "tleubekova123",
    name: "Айсулу Ермековна Тлеубекова",
    title: "Руководитель отдела культуры и внутренней политики",
    role: "department_head",
    nodeId: "5-1",
    organization: "Аппарат акима области Абай",
    department: "Отдел культуры и внутренней политики",
    position: "Руководитель отдела",
    specialization: "Культура, мероприятия и внутренняя политика",
    email: "a.tleubekova@akimat.gov.kz",
    phone: "+7 (701) 000-00-12",
  },
];

export function getWorkspaceUserById(userId?: string | null) {
  if (!userId) return null;
  return WORKSPACE_USERS.find((item) => item.id === userId) ?? null;
}

export function getWorkspaceUserByLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  return WORKSPACE_USERS.find((item) => item.login.toLowerCase() === normalized) ?? null;
}

export function getRoleLabel(role: WorkspaceRole) {
  const labels: Record<WorkspaceRole, string> = {
    admin: "Администратор",
    akim: "Аким области",
    deputy: "Заместитель акима",
    department_head: "Руководитель отдела",
  };

  return labels[role];
}

export function canManageDirections(role: WorkspaceRole) {
  return role === "admin" || role === "akim" || role === "deputy";
}

export function canDeleteDirections(role: WorkspaceRole) {
  return role === "admin" || role === "akim";
}

export function canManageGroups(role: WorkspaceRole) {
  return role === "admin" || role === "akim" || role === "deputy";
}

export function canDeleteGroups(role: WorkspaceRole) {
  return role === "admin" || role === "akim";
}

export function canManageProjects(role: WorkspaceRole) {
  return (
    role === "admin" ||
    role === "akim" ||
    role === "deputy" ||
    role === "department_head"
  );
}

export function canDeleteProjects(role: WorkspaceRole) {
  return role === "admin" || role === "akim";
}

export function canViewUsers(role: WorkspaceRole) {
  return role === "admin" || role === "akim" || role === "deputy";
}

export function canEditHierarchy(role: WorkspaceRole) {
  return role === "admin" || role === "akim";
}

export function canAssignProtocolOrders(role: WorkspaceRole) {
  return role === "admin" || role === "akim" || role === "deputy";
}

export function flattenHierarchy(
  root: HierarchyNode,
  parentId: string | null = null,
  depth = 0,
): HierarchyPerson[] {
  const current: HierarchyPerson = {
    id: root.id,
    name: root.name,
    title: root.title,
    sectors: root.sectors ?? [],
    parentId,
    depth,
  };

  return [
    current,
    ...(root.children ?? []).flatMap((child) =>
      flattenHierarchy(child, root.id, depth + 1),
    ),
  ];
}

export function findHierarchyNode(root: HierarchyNode, nodeId: string): HierarchyNode | null {
  if (root.id === nodeId) {
    return root;
  }

  for (const child of root.children ?? []) {
    const found = findHierarchyNode(child, nodeId);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getAssignablePeopleForUser(
  currentUser: WorkspaceUser,
  hierarchy: HierarchyNode,
) {
  const people = flattenHierarchy(hierarchy);

  if (currentUser.role === "admin" || currentUser.role === "akim") {
    return people.filter((person) => person.id !== "akim");
  }

  if (currentUser.role === "deputy" && currentUser.nodeId) {
    return people.filter((person) => person.parentId === currentUser.nodeId);
  }

  return [];
}

export function getAvailableProjectOwners(
  currentUser: WorkspaceUser,
  hierarchy: HierarchyNode,
) {
  const people = flattenHierarchy(hierarchy);

  if (currentUser.role === "department_head" && currentUser.nodeId) {
    return people.filter((person) => person.id === currentUser.nodeId);
  }

  return people.filter((person) => person.id !== "akim");
}

export function getCreatableDirectionAuthors(
  currentUser: WorkspaceUser,
  hierarchy: HierarchyNode,
) {
  const people = flattenHierarchy(hierarchy);

  if (currentUser.role === "admin") {
    return people.filter(
      (person) =>
        person.title.includes("Аким") || person.title.includes("Зам."),
    );
  }

  if (currentUser.nodeId) {
    return people.filter((person) => person.id === currentUser.nodeId);
  }

  return [];
}

export function getAvailableDirectionExecutors(hierarchy: HierarchyNode) {
  return flattenHierarchy(hierarchy).filter((person) => person.id !== "akim");
}
