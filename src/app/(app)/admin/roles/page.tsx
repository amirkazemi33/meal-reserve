import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { upsertRoleAction } from "@/app/actions";
import { DeleteRoleButton } from "@/components/admin/delete-role-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function RolesPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.ROLES_MANAGE);

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">نقش‌ها و دسترسی</h1>
        <p className="text-muted-foreground text-sm">
          نقش‌ها مجموعه‌ای از دسترسی‌ها هستند که مسیرها و عملیات را کنترل می‌کنند.
        </p>
      </div>

      <form
        action={upsertRoleAction}
        className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
      >
        <h2 className="text-sm font-semibold">افزودن نقش</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="code">کد</Label>
            <Input
              id="code"
              name="code"
              required
              placeholder="kitchen_lead"
              dir="ltr"
              className="text-left"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">نام</Label>
            <Input id="name" name="name" required placeholder="سرآشپز" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <div className="space-y-2">
          <Label>دسترسی‌ها</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="permissionIds"
                  value={permission.id}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{permission.name}</span>
                  <span className="text-muted-foreground block text-xs" dir="ltr">
                    {permission.code}
                    {permission.route ? ` · ${permission.route}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-fit">
          ایجاد
        </Button>
      </form>

      <div className="space-y-4">
        {roles.map((role) => {
          const assigned = new Set(role.permissions.map((p) => p.permissionId));
          return (
            <form
              key={role.id}
              action={upsertRoleAction}
              className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
            >
              <input type="hidden" name="id" value={role.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>کد</Label>
                  <Input
                    name="code"
                    defaultValue={role.code}
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-1">
                  <Label>نام</Label>
                  <Input name="name" defaultValue={role.name} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>توضیحات</Label>
                <Textarea
                  name="description"
                  rows={2}
                  defaultValue={role.description ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>دسترسی‌ها</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={permission.id}
                        defaultChecked={assigned.has(permission.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{permission.name}</span>
                        <span
                          className="text-muted-foreground block text-xs"
                          dir="ltr"
                        >
                          {permission.code}
                          {permission.route ? ` · ${permission.route}` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Button type="submit" variant="outline" className="w-fit">
                  ذخیره
                </Button>
                <DeleteRoleButton
                  roleId={role.id}
                  roleName={role.name}
                  assignedUserCount={role._count.users}
                />
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
