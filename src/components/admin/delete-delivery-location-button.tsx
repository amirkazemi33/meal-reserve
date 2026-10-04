"use client";

import { useState, useTransition } from "react";
import { deleteDeliveryLocationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteDeliveryLocationButton({
  locationId,
  title,
  userCount,
  reservationCount,
}: {
  locationId: string;
  title: string;
  userCount: number;
  reservationCount: number;
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
          if (userCount > 0) {
            setError(
              `این محل به ${userCount} کاربر اختصاص دارد و قابل حذف نیست.`,
            );
            return;
          }
          if (reservationCount > 0) {
            setError("این محل در رزروها استفاده شده و قابل حذف نیست.");
            return;
          }
          if (!confirm(`محل تحویل «${title}» حذف شود؟`)) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await deleteDeliveryLocationAction(locationId);
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
