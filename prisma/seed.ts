import "dotenv/config";
import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";
import {
  CUTOFF_SETTING_KEY,
  DEFAULT_CUTOFF_TIME,
  RoleCode,
} from "../src/lib/auth/constants";
import { permissions, rolePermissions, roles } from "./rbac-seed-data";

async function main() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: {
        code: permission.code,
        name: permission.name,
        route: permission.route,
        menuKey: permission.menuKey,
      },
      update: {
        name: permission.name,
        route: permission.route,
        menuKey: permission.menuKey,
      },
    });
  }

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
      },
      update: {
        name: role.name,
        description: role.description,
      },
    });

    const codes = rolePermissions[role.code] ?? [];
    const permissionRows = await prisma.permission.findMany({
      where: { code: { in: codes } },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: saved.id } });
    if (permissionRows.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionRows.map((permission) => ({
          roleId: saved.id,
          permissionId: permission.id,
        })),
      });
    }
  }

  await prisma.appSetting.upsert({
    where: { key: CUTOFF_SETTING_KEY },
    create: { key: CUTOFF_SETTING_KEY, value: DEFAULT_CUTOFF_TIME },
    update: {},
  });

  const defaultDeliveryLocation = await prisma.deliveryLocation.upsert({
    where: { id: "seed-delivery-central" },
    create: {
      id: "seed-delivery-central",
      title: "مرکزی",
      address: "محل تحویل پیش‌فرض",
      isActive: true,
    },
    update: {
      title: "مرکزی",
      address: "محل تحویل پیش‌فرض",
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.ADMIN },
  });
  const employeeRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.EMPLOYEE },
  });
  const cateringRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.CATERING },
  });

  const passwordHash = await hashPassword("password123");

  const users = [
    {
      phone: "09000000001",
      name: "مدیر",
      lastName: "سیستم",
      roleIds: [adminRole.id],
    },
    {
      phone: "09000000002",
      name: "کارمند",
      lastName: "نمونه",
      roleIds: [employeeRole.id],
    },
    {
      phone: "09000000003",
      name: "کاربر",
      lastName: "کترینگ",
      roleIds: [cateringRole.id],
    },
  ];

  for (const user of users) {
    const saved = await prisma.user.upsert({
      where: { phone: user.phone },
      create: {
        phone: user.phone,
        name: user.name,
        lastName: user.lastName,
        passwordHash,
        isActive: true,
        deliveryLocationId: defaultDeliveryLocation.id,
      },
      update: {
        name: user.name,
        lastName: user.lastName,
        passwordHash,
        isActive: true,
        deliveryLocationId: defaultDeliveryLocation.id,
      },
    });

    await prisma.userRole.deleteMany({ where: { userId: saved.id } });
    await prisma.userRole.createMany({
      data: user.roleIds.map((roleId) => ({
        userId: saved.id,
        roleId,
      })),
    });
  }

  const lunch = await prisma.mealPeriod.upsert({
    where: { id: "seed-lunch" },
    create: {
      id: "seed-lunch",
      title: "ناهار",
      startTime: "12:00",
      endTime: "14:00",
      description: "وعده اصلی ظهر",
      sortOrder: 1,
    },
    update: {
      title: "ناهار",
      startTime: "12:00",
      endTime: "14:00",
      description: "وعده اصلی ظهر",
      isActive: true,
      sortOrder: 1,
    },
  });

  const dinner = await prisma.mealPeriod.upsert({
    where: { id: "seed-dinner" },
    create: {
      id: "seed-dinner",
      title: "شام",
      startTime: "18:00",
      endTime: "20:00",
      description: "وعده عصر",
      sortOrder: 2,
    },
    update: {
      title: "شام",
      startTime: "18:00",
      endTime: "20:00",
      description: "وعده عصر",
      isActive: true,
      sortOrder: 2,
    },
  });

  const foods = [
    { id: "seed-food-kebab", title: "جوجه کباب", description: "گریل‌شده" },
    { id: "seed-food-rice", title: "چلو خورشت", description: "خورشت روز" },
    { id: "seed-food-pasta", title: "پاستا", description: "سس گوجه‌فرنگی" },
    { id: "seed-food-salad", title: "سالاد", description: "سبزیجات تازه" },
  ];

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      create: { ...food, isActive: true },
      update: {
        title: food.title,
        description: food.description,
        isActive: true,
      },
    });
  }

  // Seed next week menu (Sat–Wed) for demo — Iranian week starts Saturday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const saturdayOffset = -((day + 1) % 7);
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + saturdayOffset + 7);

  const foodIds = foods.map((f) => f.id);
  for (let i = 0; i < 5; i++) {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + i);

    for (const mealPeriod of [lunch, dinner]) {
      const foodId =
        foodIds[(i + (mealPeriod.id === dinner.id ? 1 : 0)) % foodIds.length];
      await prisma.menuItem.upsert({
        where: {
          date_mealPeriodId_foodId: {
            date,
            mealPeriodId: mealPeriod.id,
            foodId,
          },
        },
        create: {
          date,
          mealPeriodId: mealPeriod.id,
          foodId,
        },
        update: {},
      });
      const altFood = foodIds[(i + 2) % foodIds.length];
      if (altFood !== foodId) {
        await prisma.menuItem.upsert({
          where: {
            date_mealPeriodId_foodId: {
              date,
              mealPeriodId: mealPeriod.id,
              foodId: altFood,
            },
          },
          create: {
            date,
            mealPeriodId: mealPeriod.id,
            foodId: altFood,
          },
          update: {},
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Demo users (password: password123):");
  console.log("  Admin     09000000001");
  console.log("  Employee  09000000002");
  console.log("  Catering  09000000003");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
