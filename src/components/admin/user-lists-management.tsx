"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CirclePlus } from "lucide-react";

import { deleteUserListAction, upsertUserListAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

export type UserListSummary = {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
};

type UserListsManagementProps = {
  lists: UserListSummary[];
};

export function UserListsManagement({ lists }: UserListsManagementProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserListSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upsertUserListAction(formData);
        setCreateOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ثبت ناموفق بود");
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upsertUserListAction(formData);
        setEditing(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
      }
    });
  }

  function handleDelete(listId: string) {
    if (!confirm("این لیست حذف شود؟")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteUserListAction(listId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حذف ناموفق بود");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">لیست کاربر</h1>
          <p className="text-muted-foreground text-sm">
            لیست‌های اختصاصی خود را بسازید و افراد را به آن‌ها اضافه کنید.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <CirclePlus
            className="size-4 text-green-700"
            data-icon="inline-start"
          />
          لیست جدید
        </Button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {lists.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          هنوز لیستی ندارید. یک لیست جدید بسازید.
        </p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="border-border/70 flex flex-col gap-3 rounded-xl border bg-background/90 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/admin/user-lists/${list.id}`}
                  className="text-base font-semibold hover:underline"
                >
                  {list.title}
                </Link>
                {list.description ? (
                  <p className="text-muted-foreground text-sm">
                    {list.description}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {list.memberCount} عضو
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  render={<Link href={`/admin/user-lists/${list.id}`} />}
                >
                  اعضا
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    setEditing(list);
                  }}
                >
                  ویرایش
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => handleDelete(list.id)}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>لیست جدید</DialogTitle>
            <DialogDescription>
              عنوان و توضیحات لیست را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-list-title">عنوان</Label>
              <Input id="create-list-title" name="title" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-list-description">توضیحات</Label>
              <Textarea
                id="create-list-description"
                name="description"
                rows={3}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setCreateOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "…" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش لیست</DialogTitle>
            <DialogDescription>
              عنوان و توضیحات لیست را به‌روزرسانی کنید.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editing.id} />
              <div className="space-y-1">
                <Label htmlFor="edit-list-title">عنوان</Label>
                <Input
                  id="edit-list-title"
                  name="title"
                  defaultValue={editing.title}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-list-description">توضیحات</Label>
                <Textarea
                  id="edit-list-description"
                  name="description"
                  rows={3}
                  defaultValue={editing.description ?? ""}
                />
              </div>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "…" : "ذخیره"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
