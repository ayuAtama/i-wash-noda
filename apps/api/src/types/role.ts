// src/types/role.ts

export const USER_ROLES = [
  "super_admin",
  "outlet_admin",
  "worker",
  "driver",
  "customer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}
