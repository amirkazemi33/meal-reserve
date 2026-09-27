import { PermissionCode, RoleCode } from "../src/lib/auth/constants";

export const permissions = [
  {
    code: PermissionCode.MENU_MANAGE,
    name: "مدیریت منو",
    route: "/admin/menu",
    menuKey: "admin.menu",
  },
  {
    code: PermissionCode.FOOD_MANAGE,
    name: "مدیریت غذاها",
    route: "/admin/foods",
    menuKey: "admin.foods",
  },
  {
    code: PermissionCode.MEAL_PERIOD_MANAGE,
    name: "مدیریت وعده‌ها",
    route: "/admin/meal-periods",
    menuKey: "admin.meal-periods",
  },
  {
    code: PermissionCode.DELIVERY_LOCATION_MANAGE,
    name: "مدیریت محل‌های تحویل",
    route: "/admin/delivery-locations",
    menuKey: "admin.delivery-locations",
  },
  {
    code: PermissionCode.RESERVATION_CREATE,
    name: "ثبت رزرو",
    route: "/menu",
    menuKey: "menu",
  },
  {
    code: PermissionCode.RESERVATION_CANCEL,
    name: "لغو رزرو",
    route: "/menu",
    menuKey: "menu",
  },
  {
    code: PermissionCode.RESERVATION_FOR_OTHERS,
    name: "رزرو برای دیگران",
    route: "/admin/reserve-for",
    menuKey: "admin.reserve-for",
  },
  {
    code: PermissionCode.RESERVATION_SELECT_DELIVERY_LOCATION,
    name: "انتخاب محل تحویل رزرو",
    route: "/menu",
    menuKey: "menu",
  },
  {
    code: PermissionCode.RESERVATION_QUANTITY,
    name: "تعداد",
    route: "/menu",
    menuKey: "menu",
  },
  {
    code: PermissionCode.FEEDBACK_CREATE,
    name: "ثبت نظر",
    route: "/feedback",
    menuKey: "feedback",
  },
  {
    code: PermissionCode.REPORT_COOKING,
    name: "آمار پخت",
    route: "/cooking-report",
    menuKey: "cooking-report",
  },
  {
    code: PermissionCode.REPORT_RESERVATIONS,
    name: "گزارش رزروها",
    route: "/admin/reports",
    menuKey: "admin.reports",
  },
  {
    code: PermissionCode.USERS_MANAGE,
    name: "مدیریت کاربران",
    route: "/admin/users",
    menuKey: "admin.users",
  },
  {
    code: PermissionCode.USER_LIST_MANAGE,
    name: "لیست کاربر",
    route: "/admin/user-lists",
    menuKey: "admin.user-lists",
  },
  {
    code: PermissionCode.ROLES_MANAGE,
    name: "مدیریت نقش‌ها",
    route: "/admin/roles",
    menuKey: "admin.roles",
  },
  {
    code: PermissionCode.SETTINGS_CUTOFF,
    name: "تنظیم ضرب‌الاجل",
    route: "/admin/settings",
    menuKey: "admin.settings",
  },
] as const;

export const roles = [
  {
    code: RoleCode.ADMIN,
    name: "مدیر سیستم",
    description: "دسترسی کامل به سامانه",
  },
  {
    code: RoleCode.EMPLOYEE,
    name: "کارمند",
    description: "رزرو غذا و ثبت نظر",
  },
  {
    code: RoleCode.CATERING,
    name: "کترینگ",
    description: "تولید منو و آمار پخت",
  },
] as const;

export const rolePermissions: Record<string, string[]> = {
  [RoleCode.ADMIN]: permissions.map((p) => p.code),
  [RoleCode.EMPLOYEE]: [
    PermissionCode.RESERVATION_CREATE,
    PermissionCode.RESERVATION_CANCEL,
    PermissionCode.FEEDBACK_CREATE,
  ],
  [RoleCode.CATERING]: [
    PermissionCode.MENU_MANAGE,
    PermissionCode.FOOD_MANAGE,
    PermissionCode.MEAL_PERIOD_MANAGE,
    PermissionCode.REPORT_COOKING,
  ],
};
