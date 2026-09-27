"use client";

import { useState, useTransition } from "react";
import { deleteRoleAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteRoleButton({
  roleId,
  roleName,
  assignedUserCount,
}: {
  roleId: string;
  roleName: string;
  assignedUserCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (assignedUserCount > 0) {
            setError(
              `این نقش به ${assignedUserCount} کاربر اختصاص دارد و قابل حذف نیست.`,
            );
            return;
          }
          if (!confirm(`نقش «${roleName}» حذف شود؟`)) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await deleteRoleAction(roleId);
              if (result?.error) setError(result.error);
            } catch (err) {
              setError(err instanceof Error ? err.message : "حذف ناموفق بود");
            }
          });
        }}
      >
        {pending ? "در حال حذف…" : "حذف"}
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
