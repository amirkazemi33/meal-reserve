export const SESSION_COOKIE = "meal_reserve_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const CUTOFF_SETTING_KEY = "cutoff_time";
export const DEFAULT_CUTOFF_TIME = "16:00";

export const PermissionCode = {
  MENU_MANAGE: "menu.manage",
  FOOD_MANAGE: "food.manage",
  MEAL_PERIOD_MANAGE: "meal_period.manage",
  RESERVATION_CREATE: "reservation.create",
  RESERVATION_CANCEL: "reservation.cancel",
  FEEDBACK_CREATE: "feedback.create",
  REPORT_COOKING: "report.cooking",
  REPORT_RESERVATIONS: "report.reservations",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  SETTINGS_CUTOFF: "settings.cutoff",
} as const;

export type PermissionCodeValue =
  (typeof PermissionCode)[keyof typeof PermissionCode];

export const RoleCode = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  CATERING: "catering",
} as const;
