import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { UsersManagement } from "@/components/admin/users-management";

export default async function UsersPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.USERS_MANAGE);

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <UsersManagement
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        phone: user.phone,
        isActive: user.isActive,
        roles: user.roles.map((ur) => ({
          roleId: ur.roleId,
          role: { id: ur.role.id, name: ur.role.name },
        })),
      }))}
      roles={roles.map((role) => ({ id: role.id, name: role.name }))}
    />
  );
}
