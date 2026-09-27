"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Copy,
  Eye,
  EyeOff,
  FunnelX,
  ListFilterPlus,
  Pencil,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generatePassword } from "@/lib/auth/generate-password";
import { cn } from "@/lib/utils";

export type UsersRoleOption = {
  id: string;
  name: string;
};

export type DeliveryLocationOption = {
  id: string;
  title: string;
  isActive: boolean;
};

export type UsersListItem = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  deliveryLocationId: string;
  deliveryLocationTitle: string;
  roles: { roleId: string; role: { id: string; name: string } }[];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type StatusFilter = "all" | "active" | "inactive";

type UsersManagementProps = {
  currentUserId: string;
  users: UsersListItem[];
  roles: UsersRoleOption[];
  deliveryLocations: DeliveryLocationOption[];
};

export function UsersManagement({
  currentUserId,
  users,
  roles,
  deliveryLocations,
}: UsersManagementProps) {
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [creating, startCreate] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [editingUser, setEditingUser] = useState<UsersListItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, startSave] = useTransition();

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

  useEffect(() => {
    setPage(1);
  }, [search, roleId, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(pageStart, pageStart + pageSize);

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

  function openEdit(user: UsersListItem) {
    setEditingUser(user);
    setEditOpen(true);
  }

  function handleSave(formData: FormData) {
    startSave(async () => {
      await upsertUserAction(formData);
      setEditOpen(false);
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
          <CirclePlus
            className="size-4 text-green-700"
            data-icon="inline-start"
          />
          کاربر جدید
        </Button>
      </div>

      <Card
        className={cn(
          "bg-card transition-all duration-300",
          "**:data-[slot=input]:bg-background [&_input]:bg-background [&_select]:bg-background",
          filtersOpen
            ? "border-b border-[#aeaeae] py-3 lg:py-4"
            : "py-1 lg:py-2",
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
                    filtersOpen && "rotate-180",
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
            <div className="space-y-1">
              <Label htmlFor="create-delivery-location">محل تحویل</Label>
              <select
                id="create-delivery-location"
                name="deliveryLocationId"
                required
                className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={
                  deliveryLocations.find((l) => l.isActive)?.id ??
                  deliveryLocations[0]?.id ??
                  ""
                }
              >
                {deliveryLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                    {!location.isActive ? " (غیرفعال)" : ""}
                  </option>
                ))}
              </select>
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

      <div className="space-y-3">
        <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>نام خانوادگی</TableHead>
                <TableHead>شماره موبایل</TableHead>
                <TableHead>محل تحویل</TableHead>
                <TableHead>نقش‌ها</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="text-end">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-center"
                  >
                    کاربری با این فیلترها پیدا نشد.
                  </TableCell>
                </TableRow>
              ) : (
                pagedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell dir="ltr" className="text-left">
                      {user.phone}
                    </TableCell>
                    <TableCell>{user.deliveryLocationTitle}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          user.roles.map((ur) => (
                            <Badge key={ur.roleId} variant="secondary">
                              {ur.role.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "outline"}>
                        {user.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-start justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil data-icon="inline-start" />
                          تدوین
                        </Button>
                        <DeleteUserButton
                          userId={user.id}
                          isSelf={user.id === currentUserId}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="users-page-size">تعداد در صفحه</Label>
              <select
                id="users-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                  );
                  setPage(1);
                }}
                className="border-input h-8 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="صفحه قبل"
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-muted-foreground min-w-20 text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="صفحه بعد"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {editOpen && editingUser ? (
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!saving) setEditOpen(open);
        }}
      >
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>تدوین کاربر</DialogTitle>
            <DialogDescription>
              {editingUser
                ? `${editingUser.name} ${editingUser.lastName}`
                : "اطلاعات کاربر را ویرایش کنید."}
            </DialogDescription>
          </DialogHeader>

            <form
              key={editingUser.id}
              action={handleSave}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={editingUser.id} />
              <div className="space-y-1">
                <Label htmlFor="edit-name">نام</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingUser.name}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-last-name">نام خانوادگی</Label>
                <Input
                  id="edit-last-name"
                  name="lastName"
                  defaultValue={editingUser.lastName}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone">شماره موبایل</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingUser.phone}
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-delivery-location">محل تحویل</Label>
                <select
                  id="edit-delivery-location"
                  name="deliveryLocationId"
                  required
                  defaultValue={editingUser.deliveryLocationId}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {deliveryLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.title}
                      {!location.isActive ? " (غیرفعال)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-password">رمز جدید (اختیاری)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  dir="ltr"
                  className="text-left"
                  autoComplete="new-password"
                />
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingUser.isActive}
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
                        defaultChecked={editingUser.roles.some(
                          (item) => item.roleId === role.id,
                        )}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "در حال ذخیره…" : "تأیید"}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      ) : null}
    </div>
  );
}
