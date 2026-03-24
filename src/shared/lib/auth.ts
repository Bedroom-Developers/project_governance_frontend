import {
  getWorkspaceUserById,
  getWorkspaceUserByLogin,
  WORKSPACE_USERS,
} from "@/shared/lib/app-users";

export const AUTH_COOKIE_NAME = "adp-auth";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const ADMIN_LOGIN =
  WORKSPACE_USERS.find((user) => user.id === "admin")?.login ?? "admin";
export const ADMIN_PASSWORD =
  WORKSPACE_USERS.find((user) => user.id === "admin")?.password ?? "123123";

export function getAuthenticatedUserById(userId?: string | null) {
  return getWorkspaceUserById(userId);
}

export function authenticateUser(login: string, password: string) {
  const user = getWorkspaceUserByLogin(login);
  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

export function setClientAuthCookie(userId: string, remember = true) {
  const base = `${AUTH_COOKIE_NAME}=${encodeURIComponent(userId)}; path=/; SameSite=Lax`;
  document.cookie = remember ? `${base}; max-age=${COOKIE_MAX_AGE}` : base;
}

export function clearClientAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getClientAuthenticatedUser() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split("=")[1];

  return getAuthenticatedUserById(
    cookieValue ? decodeURIComponent(cookieValue) : null,
  );
}
