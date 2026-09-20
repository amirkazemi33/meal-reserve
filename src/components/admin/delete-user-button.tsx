"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("این کاربر حذف شود؟")) return;
        startTransition(async () => {
          await deleteUserAction(userId);
        });
      }}
    >
      {pending ? "در حال حذف…" : "حذف"}
    </Button>
  );
}
