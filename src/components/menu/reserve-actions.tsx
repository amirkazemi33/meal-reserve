"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelReservationAction,
  reserveMenuItemAction,
} from "@/app/actions";

export function ReserveButton({
  menuItemId,
  disabled,
  selected,
}: {
  menuItemId: string;
  disabled?: boolean;
  selected?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          await reserveMenuItemAction(menuItemId);
        });
      }}
    >
      {pending ? "…" : selected ? "انتخاب‌شده" : "انتخاب"}
    </Button>
  );
}

export function CancelButton({
  reservationId,
  disabled,
}: {
  reservationId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          await cancelReservationAction(reservationId);
        });
      }}
    >
      {pending ? "…" : "لغو"}
    </Button>
  );
}
