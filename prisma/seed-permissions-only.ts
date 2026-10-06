/**
 * Production-safe RBAC seed:
 * - Upserts all Permission rows
 * - Upserts baseline Role rows (admin / employee / catering)
 * - Adds missing RolePermission grants only (never deletes existing grants)
 * - Does not touch users, menus, foods, or other app data
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { permissions, rolePermissions, roles } from "./rbac-seed-data";

async function main() {
  let permissionsUpserted = 0;
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
    permissionsUpserted += 1;
  }

  let rolesUpserted = 0;
  let grantsAdded = 0;

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
    rolesUpserted += 1;

    const codes = rolePermissions[role.code] ?? [];
    if (codes.length === 0) continue;

    const permissionRows = await prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });

    const existing = await prisma.rolePermission.findMany({
      where: { roleId: saved.id },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((row) => row.permissionId));

    const missing = permissionRows.filter((row) => !existingIds.has(row.id));
    if (missing.length === 0) continue;

    await prisma.rolePermission.createMany({
      data: missing.map((permission) => ({
        roleId: saved.id,
        permissionId: permission.id,
      })),
    });
    grantsAdded += missing.length;
  }

  const permissionCount = await prisma.permission.count();
  console.log("Permissions-only seed complete.");
  console.log(`  Permissions upserted: ${permissionsUpserted}`);
  console.log(`  Roles upserted: ${rolesUpserted}`);
  console.log(`  Role grants added: ${grantsAdded}`);
  console.log(`  Permission rows in DB: ${permissionCount}`);
  console.log(
    "Users must log out and log in again to refresh session permissions.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
