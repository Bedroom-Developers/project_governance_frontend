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

function normalizeGovernmentText(value?: string) {
  if (!value) return value ?? "";

  return value
    .replace(/заместитель мэра/gi, "Заместитель акима")
    .replace(/зам\. мэра/gi, "Зам. Акима")
    .replace(/мэр/gi, "аким");
}

export function normalizeHierarchyNode(node: HierarchyNode): HierarchyNode {
  return {
    ...node,
    title: normalizeGovernmentText(node.title),
    sectors: node.sectors,
    children: (node.children ?? []).map(normalizeHierarchyNode),
  };
}

function normalizeWorkspaceUser(user: WorkspaceUser): WorkspaceUser {
  return {
    ...user,
    title: normalizeGovernmentText(user.title),
    department: normalizeGovernmentText(user.department),
    position: normalizeGovernmentText(user.position),
    specialization: normalizeGovernmentText(user.specialization),
  };
}

export const ABAI_MANAGEMENTS = [
  "Управление экономики и бюджетного планирования",
  "Управление финансов",
  "Управление энергетики и жилищно-коммунального хозяйства",
  "Управление государственного архитектурно-строительного контроля",
  "Управление здравоохранения",
  "Управление предпринимательства и индустриально-инновационного развития",
  "Управление пассажирского транспорта и автомобильных дорог",
  "Управление строительства",
  "Управление государственных закупок",
  "Управление мобилизационной подготовки и гражданской защиты",
  "Управление координации занятости и социальных программ",
  "Управление цифровых технологий",
  "Управление культуры, развития языков и архивного дела",
  "Управление внутренней политики",
  "Управление образования",
  "Управление физической культуры и спорта",
  "Управление по вопросам молодежной политики",
  "Управление по делам религий",
  "Управление сельского хозяйства",
  "Управление ветеринарии",
  "Управление природных ресурсов и регулирования природопользования",
  "Управление туризма",
  "Управление архитектуры, градостроительства и земельных отношений",
] as const;

export const ABAI_REGIONS = [
  "Семей қаласы",
  "Курчатов қаласы",
  "Абай ауданы",
  "Ақсуат ауданы",
  "Аягөз ауданы",
  "Бесқарағай ауданы",
  "Бородулиха ауданы",
  "Жаңасемей ауданы",
  "Жарма ауданы",
  "Көкпекті ауданы",
  "Мақаншы ауданы",
  "Үржар ауданы",
] as const;

export const DEFAULT_HIERARCHY: HierarchyNode = normalizeHierarchyNode({
  id: "akim",
  name: "Берик Уали",
  title: "Аким Области Абай",
  children: [
    {
      id: "1",
      name: "Ербол Садыр Абилхайырулы",
      title: "Зам. Акима Области Абай",
      sectors: [
        ABAI_MANAGEMENTS[0],
        ABAI_MANAGEMENTS[1],
        ABAI_MANAGEMENTS[8],
        ABAI_MANAGEMENTS[11],
        ABAI_MANAGEMENTS[10],
      ],
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
      sectors: [
        ABAI_MANAGEMENTS[9],
        ABAI_MANAGEMENTS[13],
        ABAI_MANAGEMENTS[16],
        ABAI_MANAGEMENTS[17],
        ABAI_MANAGEMENTS[12],
      ],
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
      sectors: [
        ABAI_MANAGEMENTS[2],
        ABAI_MANAGEMENTS[6],
        ABAI_MANAGEMENTS[7],
        ABAI_MANAGEMENTS[3],
        ABAI_MANAGEMENTS[22],
      ],
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
      sectors: [
        ABAI_MANAGEMENTS[18],
        ABAI_MANAGEMENTS[19],
        ABAI_MANAGEMENTS[14],
        ABAI_MANAGEMENTS[15],
        ABAI_MANAGEMENTS[4],
      ],
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
      sectors: [
        ABAI_MANAGEMENTS[5],
        ABAI_MANAGEMENTS[20],
        ABAI_MANAGEMENTS[21],
      ],
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
});

export const WORKSPACE_USERS: WorkspaceUser[] = ([
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
    email: "admin@test.local",
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
    email: "berik.uali@test.local",
    phone: "+7 (701) 000-00-02",
  },
  {
    id: "deputy-sadyr",
    login: "sadyr",
    password: "sadyr123",
    name: "Ербол Садыр Абилхайырулы",
    title: "Заместитель акима области Абай",
    role: "deputy",
    nodeId: "1",
    organization: "Аппарат акима области Абай",
    department: "Экономика, финансы и госзаказы",
    position: "Заместитель акима области",
    specialization: "Экономический блок и государственные закупки",
    email: "e.sadyr@test.local",
    phone: "+7 (701) 000-00-03",
  },
  {
    id: "deputy-bakpaev",
    login: "bakpaev",
    password: "bakpaev123",
    name: "Эльдар Кусманулы Бакпаев",
    title: "Заместитель акима области Абай",
    role: "deputy",
    nodeId: "2",
    organization: "Аппарат акима области Абай",
    department: "Кадры, юристы и взаимодействие с акиматами",
    position: "Заместитель акима области",
    specialization: "Оргвопросы, кадры и правовое сопровождение",
    email: "e.bakpaev@test.local",
    phone: "+7 (701) 000-00-04",
  },
  {
    id: "deputy-tulenbergenov",
    login: "tulenbergenov",
    password: "tulenbergenov123",
    name: "Туленбергенов Серик Тулювгалиевич",
    title: "Заместитель акима области Абай",
    role: "deputy",
    nodeId: "3",
    organization: "Аппарат акима области Абай",
    department: "ЖКХ и дороги",
    position: "Заместитель акима области",
    specialization: "Инфраструктура, строительство и дорожная сеть",
    email: "s.tulenbergenov@test.local",
    phone: "+7 (701) 000-00-05",
  },
  {
    id: "deputy-ospanov",
    login: "ospanov",
    password: "ospanov123",
    name: "Думан Рыспекович Оспанов",
    title: "Заместитель акима области Абай",
    role: "deputy",
    nodeId: "4",
    organization: "Аппарат акима области Абай",
    department: "Ветеринария и УСХ",
    position: "Заместитель акима области",
    specialization: "Сельское хозяйство и ветеринарный контроль",
    email: "d.ospanov@test.local",
    phone: "+7 (701) 000-00-06",
  },
  {
    id: "deputy-rakhanov",
    login: "rakhanov",
    password: "rakhanov123",
    name: "Раханов Мейрлан Акылбекович",
    title: "Заместитель акима области Абай",
    role: "deputy",
    nodeId: "5",
    organization: "Аппарат акима области Абай",
    department: "Культура и УВП",
    position: "Заместитель акима области",
    specialization: "Культура и внутренняя политика",
    email: "m.rakhanov@test.local",
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
    email: "a.kairatova@test.local",
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
    email: "r.akhmetov@test.local",
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
    email: "k.kazhgaliyeva@test.local",
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
    email: "n.nurgaliev@test.local",
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
    email: "a.tleubekova@test.local",
    phone: "+7 (701) 000-00-12",
  },
] as WorkspaceUser[]).map(normalizeWorkspaceUser);

export function getWorkspaceUserById(userId?: string | null) {
  if (!userId) return null;
  const user = WORKSPACE_USERS.find((item) => item.id === userId) ?? null;
  return user ? normalizeWorkspaceUser(user) : null;
}

export function getWorkspaceUserByLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  const user =
    WORKSPACE_USERS.find((item) => item.login.toLowerCase() === normalized) ?? null;
  return user ? normalizeWorkspaceUser(user) : null;
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
    title: normalizeGovernmentText(root.title),
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
    return normalizeHierarchyNode(root);
  }

  for (const child of root.children ?? []) {
    const found = findHierarchyNode(child, nodeId);
    if (found) {
      return normalizeHierarchyNode(found);
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
