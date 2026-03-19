"use client";

import { Building2, Mail, Phone, UserRound, Users, Wallet } from "lucide-react";
import type * as React from "react";

import { UserAvatar } from "@/modules/users";
import type { User } from "@/modules/users/schemas/user.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

export type UsersSystemRole = User["role"];

export type UserProjectAccess = {
  projectName: string;
  projectRole: string;
};

export type UserDetailsDialogItem = {
  id: number;
  fio: string;
  systemRole: UsersSystemRole;
  organization: string;
  department: string;
  position: string;
  specialization: string;
  email: string;
  phone: string;
  projects: UserProjectAccess[];
  user: Pick<User, "id" | "email" | "name" | "avatar" | "role" | "isActive">;
};

type UserDetailsDialogProps = {
  item: UserDetailsDialogItem;
  trigger: React.ReactNode;
};

const systemRoleLabels: Record<UsersSystemRole, string> = {
  admin: "Администратор",
  user: "Пользователь",
  moderator: "Модератор",
};

const systemRoleBadgeClassByRole: Record<UsersSystemRole, string> = {
  admin: "bg-[#eef1ff] text-[#696cff]",
  user: "bg-neutral-50 text-[#4b5563]",
  moderator: "bg-[#f5f5f9] text-[#6b7280]",
};

export function UserDetailsDialog({ item, trigger }: UserDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="text-left">{trigger}</DialogTrigger>

      <DialogContent className="max-w-6xl space-y-6">
        <DialogHeader className="space-y-4 rounded-2xl border border-neutral-200/70 bg-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold leading-snug text-[#1f2933]">
                {item.fio}
              </DialogTitle>
              <p className="text-sm text-[#6b7280]">{item.specialization}</p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${systemRoleBadgeClassByRole[item.systemRole]}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="size-3" />
                  {systemRoleLabels[item.systemRole]}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#9ca3af]">
            <span className="inline-flex items-center gap-2">
              <Building2 className="size-3.5 text-[#9ca3af]" />
              {item.organization}
            </span>
            <span className="hidden h-3 w-px bg-neutral-200 sm:inline-block" />
            <span className="inline-flex items-center gap-2">
              <UserRound className="size-3.5 text-[#9ca3af]" />
              {item.department}
            </span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="space-y-5">
            <section className="rounded-xl border border-neutral-200/70 bg-white">
              <div className="px-5 pt-4">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-[#696cff]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    Основная информация
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-neutral-200/70 bg-white px-3 py-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                        Должность
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-[#2f2b3d]">
                        {item.position}
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200/70 bg-white px-3 py-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                        Отдел
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-[#2f2b3d]">
                        {item.organization} / {item.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-neutral-200/70 bg-white p-3">
                    <UserAvatar
                      user={{
                        id: item.user.id,
                        name: item.user.name,
                        email: item.user.email,
                        avatar: item.user.avatar,
                        role: item.user.role,
                        isActive: item.user.isActive,
                        createdAt: "2026-01-01T00:00:00Z",
                        updatedAt: "2026-01-01T00:00:00Z",
                      }}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                        Контакты
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4b5563]">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="size-4 text-[#9ca3af]" />
                          {item.email}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="size-4 text-[#9ca3af]" />
                          {item.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-neutral-200/70 bg-white">
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#696cff]" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                  Доступы к проектам
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {item.projects.map((project) => (
                  <div
                    key={project.projectName}
                    className="flex flex-col gap-1 rounded-lg border border-neutral-200/70 bg-white px-3 py-2"
                  >
                    <div className="text-sm font-semibold text-[#2f2b3d]">
                      {project.projectName}
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      Роль в проекте:{" "}
                      <span className="font-semibold text-[#4b5563]">
                        {project.projectRole}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
