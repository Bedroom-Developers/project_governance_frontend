import type { Metadata } from "next";

import type { UserDetailsDialogItem } from "@/modules/users/ui/widgets/user-details-dialog/user-details-dialog";
import { UsersTable } from "@/modules/users/ui/widgets/users-table/users-table";

const MOCK_USERS: UserDetailsDialogItem[] = [
  {
    id: 1,
    fio: "Нурлан Абдрахманов",
    systemRole: "admin",
    organization: "Аппарат акима области Абай",
    department: "Управление строительства и ЖКХ",
    position: "Руководитель направления",
    specialization: "Строительство и инфраструктура",
    email: "n.abdrakhmanov@akimat.gov.kz",
    phone: "+7 (701) 123-45-67",
    projects: [
      {
        projectName: "Модернизация водоснабжения",
        projectRole: "Куратор проекта",
      },
      {
        projectName: "Строительство спортивного комплекса",
        projectRole: "Руководитель рабочей группы",
      },
      {
        projectName: "Энергоэффективность: модернизация электросетей",
        projectRole: "Эксперт по инфраструктуре",
      },
    ],
    user: {
      id: 1,
      email: "n.abdrakhmanov@akimat.gov.kz",
      name: "Нурлан Абдрахманов",
      avatar: "",
      role: "admin",
      isActive: true,
    },
  },
  {
    id: 2,
    fio: "Данияр Смагулов",
    systemRole: "user",
    organization: "УЖКХ области Абай",
    department: "Отдел водоснабжения и водоотведения",
    position: "Старший инженер",
    specialization: "Водоснабжение и канализация (ЖКХ)",
    email: "d.smagulov@zhkh.gov.kz",
    phone: "+7 (705) 222-10-01",
    projects: [
      {
        projectName: "Модернизация водоснабжения",
        projectRole: "Исполнитель",
      },
      {
        projectName: "Энергоэффективность: модернизация электросетей",
        projectRole: "Участник проекта",
      },
    ],
    user: {
      id: 2,
      email: "d.smagulov@zhkh.gov.kz",
      name: "Данияр Смагулов",
      avatar: "",
      role: "user",
      isActive: true,
    },
  },
  {
    id: 3,
    fio: "Айсулу Омарова",
    systemRole: "moderator",
    organization: "ДЧС области Абай",
    department: "Управление государственного пожарного надзора",
    position: "Инспектор",
    specialization: "Государственный пожарный надзор (ПБ и ППР)",
    email: "a.omarova@dchs.gov.kz",
    phone: "+7 (701) 888-09-33",
    projects: [
      {
        projectName: "Развитие дорожной сети и безопасности движения",
        projectRole: "Эксперт по безопасности",
      },
      {
        projectName: "Строительство спортивного комплекса",
        projectRole: "Технический согласующий",
      },
    ],
    user: {
      id: 3,
      email: "a.omarova@dchs.gov.kz",
      name: "Айсулу Омарова",
      avatar: "",
      role: "moderator",
      isActive: true,
    },
  },
  {
    id: 4,
    fio: "Марат Талгатов",
    systemRole: "user",
    organization: "Аппарат акима области Абай",
    department: "Управление пассажирского транспорта и автомобильных дорог",
    position: "Координатор",
    specialization: "Транспорт и логистика",
    email: "m.talgatov@akimat.gov.kz",
    phone: "+7 (776) 300-12-88",
    projects: [
      {
        projectName: "Развитие дорожной сети и безопасности движения",
        projectRole: "Координатор",
      },
      {
        projectName: "Модернизация водоснабжения",
        projectRole: "Участник проекта",
      },
    ],
    user: {
      id: 4,
      email: "m.talgatov@akimat.gov.kz",
      name: "Марат Талгатов",
      avatar: "",
      role: "user",
      isActive: true,
    },
  },
  {
    id: 5,
    fio: "Светлана Касымова",
    systemRole: "user",
    organization: "УЖКХ области Абай",
    department: "Отдел благоустройства и озеленения",
    position: "Специалист по эксплуатации",
    specialization: "Благоустройство и содержание территорий",
    email: "s.kasymova@zhkh.gov.kz",
    phone: "+7 (700) 444-77-66",
    projects: [
      {
        projectName: "Энергоэффективность: модернизация электросетей",
        projectRole: "Участник проекта",
      },
      {
        projectName: "Строительство спортивного комплекса",
        projectRole: "Исполнитель",
      },
    ],
    user: {
      id: 5,
      email: "s.kasymova@zhkh.gov.kz",
      name: "Светлана Касымова",
      avatar: "",
      role: "user",
      isActive: true,
    },
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Пользователи" };
}

export default async function UsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Пользователи
        </h1>
        <div className="mt-1 text-sm text-neutral-500">
          Список сотрудников с ролями, отделами и доступами к проектам.
        </div>
      </div>

      <UsersTable items={MOCK_USERS} />
    </div>
  );
}
