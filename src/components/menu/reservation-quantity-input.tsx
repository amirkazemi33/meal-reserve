"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_RESERVATION_QUANTITY,
  MIN_RESERVATION_QUANTITY,
  parseReservationQuantity,
} from "@/lib/meals/quantity";

export function ReservationQuantityInput({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={id} className="text-xs">
        تعداد
      </Label>
      <Input
        id={id}
        type="number"
        min={MIN_RESERVATION_QUANTITY}
        max={MAX_RESERVATION_QUANTITY}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        dir="ltr"
        className="h-7 w-16 px-2 text-center text-sm"
        onChange={(event) => {
          if (event.target.value === "") return;
          onChange(parseReservationQuantity(event.target.value));
        }}
      />
    </div>
  );
}
