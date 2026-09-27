"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  FunnelX,
  ListFilterPlus,
} from "lucide-react";

import {
  removeUserListMemberAction,
  syncUserListMembersAction,
} from "@/app/actions";
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
import { cn } from "@/lib/utils";

export type UserListMemberItem = {
  userId: string;
  name: string;
  lastName: string;
  phone: string;
  isActive: boolean;
};

export type UserPickerOption = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
};

type UserListDetailProps = {
  list: {
    id: string;
    title: string;
    description: string | null;
    members: UserListMemberItem[];
  };
  pickerUsers: UserPickerOption[];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function UserListDetail({ list, pickerUsers }: UserListDetailProps) {
  const [memberName, setMemberName] = useState("");
  const [memberLastName, setMemberLastName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [pickerFiltersOpen, setPickerFiltersOpen] = useState(true);
  const [pickerName, setPickerName] = useState("");
  const [pickerLastName, setPickerLastName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const memberIds = useMemo(
    () => new Set(list.members.map((member) => member.userId)),
    [list.members],
  );

  const filteredMembers = useMemo(() => {
    const nameQ = memberName.trim().toLowerCase();
    const lastNameQ = memberLastName.trim().toLowerCase();
    const phoneQ = memberPhone.trim();
    return list.members.filter((member) => {
      if (nameQ && !member.name.toLowerCase().includes(nameQ)) return false;
      if (lastNameQ && !member.lastName.toLowerCase().includes(lastNameQ)) {
        return false;
      }
      if (phoneQ && !member.phone.includes(phoneQ)) return false;
      return true;
    });
  }, [list.members, memberName, memberLastName, memberPhone]);

  const filteredPickerUsers = useMemo(() => {
    const nameQ = pickerName.trim().toLowerCase();
    const lastNameQ = pickerLastName.trim().toLowerCase();
    return pickerUsers.filter((user) => {
      if (nameQ && !user.name.toLowerCase().includes(nameQ)) return false;
      if (lastNameQ && !user.lastName.toLowerCase().includes(lastNameQ)) {
        return false;
      }
      return true;
    });
  }, [pickerUsers, pickerName, pickerLastName]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPickerUsers.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedPickerUsers = filteredPickerUsers.slice(
    pageStart,
    pageStart + pageSize,
  );

  const originalActiveMemberIds = useMemo(() => {
    return new Set(
      pickerUsers
        .filter((user) => memberIds.has(user.id))
        .map((user) => user.id),
    );
  }, [pickerUsers, memberIds]);

  const hasSelectionChanges = useMemo(() => {
    if (selectedIds.size !== originalActiveMemberIds.size) return true;
    for (const id of selectedIds) {
      if (!originalActiveMemberIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, originalActiveMemberIds]);

  function resetFilters() {
    setMemberName("");
    setMemberLastName("");
    setMemberPhone("");
  }

  function resetPickerFilters() {
    setPickerName("");
    setPickerLastName("");
    setPage(1);
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open);
    if (open) {
      setSelectedIds(new Set(originalActiveMemberIds));
      setPickerName("");
      setPickerLastName("");
      setPickerFiltersOpen(true);
      setPageSize(10);
      setPage(1);
      setError(null);
    }
  }

  function toggleSelected(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleConfirmMembers() {
    setError(null);
    startTransition(async () => {
      try {
        await syncUserListMembersAction(list.id, [...selectedIds]);
        setAddOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
      }
    });
  }

  function handleRemoveMember(userId: string) {
    if (!confirm("این عضو از لیست حذف شود؟")) return;
    setError(null);
    startTransition(async () => {
      try {
        await removeUserListMemberAction(list.id, userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حذف ناموفق بود");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-sm">
            <Link href="/admin/user-lists" className="hover:underline">
              لیست کاربر
            </Link>
            {" / "}
            {list.title}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {list.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {list.description?.trim() || "مدیریت اعضای این لیست."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{list.members.length} عضو</Badge>
          <Button type="button" onClick={() => handleAddOpenChange(true)}>
            <CirclePlus
              className="size-4 text-green-700"
              data-icon="inline-start"
            />
            افزودن عضو
          </Button>
        </div>
      </div>

      {error && !addOpen ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}

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
                onClick={() => handleAddOpenChange(true)}
                title="افزودن عضو"
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
                <Label htmlFor="member-name">نام</Label>
                <Input
                  id="member-name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="جستجوی نام"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="member-last-name">نام خانوادگی</Label>
                <Input
                  id="member-last-name"
                  value={memberLastName}
                  onChange={(e) => setMemberLastName(e.target.value)}
                  placeholder="جستجوی نام خانوادگی"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="member-phone">شماره موبایل</Label>
                <Input
                  id="member-phone"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="جستجوی موبایل"
                  dir="ltr"
                />
              </div>
              <p className="text-muted-foreground self-end text-sm">
                {filteredMembers.length} از {list.members.length} عضو
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>افزودن عضو</DialogTitle>
            <DialogDescription>
              کاربران فعال را فیلتر کنید، تیک بزنید و تغییرات را تأیید کنید.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Card
            className={cn(
              "bg-card shrink-0 transition-all duration-300",
              "**:data-[slot=input]:bg-background [&_input]:bg-background [&_select]:bg-background",
              pickerFiltersOpen ? "border-b border-[#aeaeae] py-3" : "py-1",
            )}
          >
            <CardContent className="flex flex-col gap-3 px-2 sm:px-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ListFilterPlus className="size-5" />
                  <span className="text-sm font-medium">فیلترها</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setPickerFiltersOpen((open) => !open)}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        pickerFiltersOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  onClick={resetPickerFilters}
                  title="پاک کردن فیلترها"
                >
                  <FunnelX className="size-4 text-red-600" />
                </Button>
              </div>

              {pickerFiltersOpen && (
                <div className="grid items-end gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="picker-name">نام</Label>
                    <Input
                      id="picker-name"
                      value={pickerName}
                      onChange={(e) => {
                        setPickerName(e.target.value);
                        setPage(1);
                      }}
                      placeholder="جستجوی نام"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="picker-last-name">نام خانوادگی</Label>
                    <Input
                      id="picker-last-name"
                      value={pickerLastName}
                      onChange={(e) => {
                        setPickerLastName(e.target.value);
                        setPage(1);
                      }}
                      placeholder="جستجوی نام خانوادگی"
                    />
                  </div>
                  <p className="text-muted-foreground self-end text-sm">
                    {filteredPickerUsers.length} از {pickerUsers.length} کاربر
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="border-border/70 min-h-0 flex-1 overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">انتخاب</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>نام خانوادگی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedPickerUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground text-center"
                    >
                      {pickerUsers.length === 0
                        ? "کاربر فعالی وجود ندارد."
                        : "نتیجه‌ای پیدا نشد."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPickerUsers.map((user) => {
                    const checked = selectedIds.has(user.id);
                    return (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer"
                        onClick={() => toggleSelected(user.id)}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelected(user.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-primary size-4"
                            aria-label={`انتخاب ${user.name} ${user.lastName}`}
                          />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.lastName}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="picker-page-size">تعداد در صفحه</Label>
              <select
                id="picker-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    Number(
                      e.target.value,
                    ) as (typeof PAGE_SIZE_OPTIONS)[number],
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={pending || !hasSelectionChanges}
              onClick={handleConfirmMembers}
            >
              {pending ? "…" : "تأیید"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>نام خانوادگی</TableHead>
              <TableHead>موبایل</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-end">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center"
                >
                  {list.members.length === 0
                    ? "عضوی در این لیست نیست."
                    : "نتیجه‌ای پیدا نشد."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.lastName}</TableCell>
                  <TableCell dir="ltr">{member.phone}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "success" : "secondary"}>
                      {member.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
