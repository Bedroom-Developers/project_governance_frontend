/**
 * Публичный API модуля Users
 * Экспортируем только то, что нужно использовать в других модулях
 */

// Константы
export {
  USER_ERROR_MESSAGES,
  USER_ROLES,
  USER_STATUS,
  USER_SUCCESS_MESSAGES,
} from "./constants/user.constants";
// Хуки
export { useUser, useUserPermissions } from "./hooks/useUser";
// Стейт-менеджмент
export { useUserStore } from "./model/user.store";
// Схемы и типы
export type {
  CreateUser,
  UpdateUser,
  User,
  UserFilters,
} from "./schemas/user.schema";
export {
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  userSchema,
} from "./schemas/user.schema";
// UI компоненты (только публичные)
export { UserAvatar } from "./ui/components/UserAvatar/UserAvatar";
export { UserCard } from "./ui/components/UserCard/UserCard";
// UI виджеты (только публичные)
export { UserProfile } from "./ui/widgets/UserProfile/UserProfile";
// Утилиты
export {
  canEditUser,
  formatUserCreatedDate,
  generateAvatarColor,
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
  isAdmin,
} from "./utils/user.utils";
