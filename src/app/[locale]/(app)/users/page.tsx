import type { Metadata } from "next";

import type { UserDetailsDialogItem } from "@/modules/users/ui/widgets/user-details-dialog/user-details-dialog";
import { UsersTable } from "@/modules/users/ui/widgets/users-table/users-table";
import { WORKSPACE_USERS } from "@/shared/lib/app-users";

const MOCK_USERS: UserDetailsDialogItem[] = WORKSPACE_USERS.map((user, index) => ({
  id: index + 1,
  fio: user.name,
  systemRole:
    user.role === "admin" || user.role === "akim"
      ? "admin"
      : user.role === "deputy"
        ? "moderator"
        : "user",
  organization: user.organization,
  department: user.department,
  position: user.position,
  specialization: user.specialization,
  email: user.email,
  phone: user.phone,
  projects:
    user.role === "department_head"
      ? [
          {
            projectName: "Строительство спортивного комплекса",
            projectRole: "Руководитель проекта / исполнитель",
          },
          {
            projectName: "Модернизация водоснабжения",
            projectRole: "Ответственный за заполнение и сопровождение",
          },
        ]
      : user.role === "deputy"
        ? [
            {
              projectName: "Строительство спортивного комплекса",
              projectRole: "Куратор направления",
            },
            {
              projectName: "Модернизация инфраструктуры",
              projectRole: "Постановщик задач и проверяющий",
            },
          ]
        : [
            {
              projectName: "Все направления платформы",
              projectRole: "Полный доступ и администрирование",
            },
          ],
  user: {
    id: index + 1,
    email: user.email,
    name: user.name,
    avatar: "",
    role:
      user.role === "department_head"
        ? "user"
        : user.role === "deputy"
          ? "moderator"
          : "admin",
    isActive: true,
  },
}));

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Пользователи" };
}

export default async function UsersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">
          Пользователи
        </h1>
        <div className="mt-1 text-sm text-[#5f6f81]">
          Список сотрудников с ролями, отделами и доступами к проектам.
        </div>
      </div>

      <UsersTable items={MOCK_USERS} />
    </div>
  );
}
