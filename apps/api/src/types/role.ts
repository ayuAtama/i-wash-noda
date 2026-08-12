// src/types/role.ts

export class UserRoleValidator {
  static readonly USER_ROLES = [
    "super_admin",
    "outlet_admin",
    "worker",
    "driver",
    "customer",
  ] as const;

  static isUserRole(value: unknown): value is UserRole {
    return UserRoleValidator.USER_ROLES.includes(value as UserRole);
  }
}

export type UserRole = (typeof UserRoleValidator.USER_ROLES)[number];
