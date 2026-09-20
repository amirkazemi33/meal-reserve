import { prisma } from "@/lib/prisma";

export async function getUserPermissionCodes(
  userId: string,
): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const codes = new Set<string>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      codes.add(rolePermission.permission.code);
    }
  }
  return [...codes].sort();
}
