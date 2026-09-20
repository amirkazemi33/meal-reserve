"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  CirclePlus,
  Copy,
  Eye,
  EyeOff,
  FunnelX,
  ListFilterPlus,
  RefreshCw,
} from "lucide-react";

import { upsertUserAction } from "@/app/actions";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePassword } from "@/lib/auth/generate-password";
import { cn } from "@/lib/utils";

export type UsersRoleOption = {
  id: string;
  name: string;
};

export type UsersListItem = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  roles: { roleId: string; role: { id: string; name: string } }[];
};

type StatusFilter = "all" | "active" | "inactive";

type UsersManagementProps = {
  users: UsersListItem[];
  roles: UsersRoleOption[];
};

export function UsersManagement({ users, roles }: UsersManagementProps) {
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [creating, startCreate] = useTransition();

  function resetCreateForm() {
    setCreatePassword("");
    setShowCreatePassword(false);
    setPasswordCopied(false);
  }

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open) resetCreateForm();
  }

  function handleGeneratePassword() {
    const next = generatePassword();
    setCreatePassword(next);
    setShowCreatePassword(true);
    setPasswordCopied(false);
  }

  async function handleCopyPassword() {
    if (!createPassword) return;
    try {
      await navigator.clipboard.writeText(createPassword);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      setPasswordCopied(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (q) {
        const haystack =
          `${user.name} ${user.lastName} ${user.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (roleId !== "all" && !user.roles.some((r) => r.roleId === roleId)) {
        return false;
      }
      if (status === "active" && !user.isActive) return false;
      if (status === "inactive" && user.isActive) return false;
      return true;
    });
  }, [users, search, roleId, status]);

  function resetFilters() {
    setSearch("");
    setRoleId("all");
    setStatus("all");
  }

  function handleCreate(formData: FormData) {
    startCreate(async () => {
      await upsertUserAction(formData);
      handleCreateOpenChange(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">کاربران</h1>
          <p className="text-muted-foreground text-sm">
            افزودن، ویرایش و اختصاص نقش به کاربران.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <CirclePlus className="size-4 text-green-700" data-icon="inline-start" />
          کاربر جدید
        </Button>
      </div>

      <Card
        className={cn(
          "bg-card transition-all duration-300",
          "**:data-[slot=input]:bg-background [&_input]:bg-background [&_select]:bg-background",
          filtersOpen
            ? "border-b border-[#aeaeae] py-3 lg:py-4"
            : "py-1 lg:py-2"
        )}
      >
        <CardContent className="flex flex-col gap-3 px-2 lg:px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ListFilterPlus className="size-5" />
              <span className="text-sm font-medium">فیلترها</span>
              <Button
                size="icon-sm"
                variant="ghost"
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    filtersOpen && "rotate-180"
                  )}
                />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => setCreateOpen(true)}
                title="کاربر جدید"
              >
                <CirclePlus className="size-4 text-green-700" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={resetFilters}
                title="پاک کردن فیلترها"
              >
                <FunnelX className="size-4 text-red-600" />
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="user-search">جستجو</Label>
                <Input
                  id="user-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="نام، نام خانوادگی یا موبایل"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="user-role-filter">نقش</Label>
                <select
                  id="user-role-filter"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">همه نقش‌ها</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="user-status-filter">وضعیت</Label>
                <select
                  id="user-status-filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <p className="text-muted-foreground self-end text-sm">
                {filteredUsers.length} از {users.length} کاربر
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>افزودن کاربر</DialogTitle>
            <DialogDescription>
              اطلاعات کاربر جدید را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <form action={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="create-name">نام</Label>
              <Input id="create-name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-last-name">نام خانوادگی</Label>
              <Input id="create-last-name" name="lastName" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-phone">شماره موبایل</Label>
              <Input
                id="create-phone"
                name="phone"
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-1 text-sm">
              <input type="checkbox" name="isActive" defaultChecked />
              فعال
            </label>
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="create-password">رمز عبور</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePassword}
                >
                  <RefreshCw data-icon="inline-start" />
                  تولید رمز
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="create-password"
                  name="password"
                  type={showCreatePassword ? "text" : "password"}
                  value={createPassword}
                  onChange={(e) => {
                    setCreatePassword(e.target.value);
                    setPasswordCopied(false);
                  }}
                  required
                  dir="ltr"
                  className="flex-1 text-left font-mono"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCreatePassword((v) => !v)}
                  title={showCreatePassword ? "مخفی کردن" : "نمایش رمز"}
                >
                  {showCreatePassword ? <EyeOff /> : <Eye />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  disabled={!createPassword}
                  title="کپی رمز"
                >
                  {passwordCopied ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>نقش‌ها</Label>
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input type="checkbox" name="roleIds" value={role.id} />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCreateOpenChange(false)}
                disabled={creating}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "در حال ایجاد…" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            کاربری با این فیلترها پیدا نشد.
          </p>
        ) : (
          filteredUsers.map((user) => {
            const roleIds = new Set(user.roles.map((r) => r.roleId));
            return (
              <form
                key={user.id}
                action={upsertUserAction}
                className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={user.id} />
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Badge variant={user.isActive ? "success" : "outline"}>
                    {user.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                  {user.roles.map((ur) => (
                    <Badge key={ur.roleId} variant="secondary">
                      {ur.role.name}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label>نام</Label>
                  <Input name="name" defaultValue={user.name} required />
                </div>
                <div className="space-y-1">
                  <Label>نام خانوادگی</Label>
                  <Input
                    name="lastName"
                    defaultValue={user.lastName}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>شماره موبایل</Label>
                  <Input
                    name="phone"
                    defaultValue={user.phone}
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-1">
                  <Label>رمز جدید (اختیاری)</Label>
                  <Input
                    name="password"
                    type="password"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <label className="flex items-center gap-2 self-end text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={user.isActive}
                  />
                  فعال
                </label>
                <div className="space-y-2 sm:col-span-2">
                  <Label>نقش‌ها</Label>
                  <div className="flex flex-wrap gap-3">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="roleIds"
                          value={role.id}
                          defaultChecked={roleIds.has(role.id)}
                        />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" variant="outline">
                    ذخیره
                  </Button>
                  <DeleteUserButton userId={user.id} />
                </div>
              </form>
            );
          })
        )}
      </div>
    </div>
  );
}
