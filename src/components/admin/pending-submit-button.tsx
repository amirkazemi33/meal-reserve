"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type PendingSubmitButtonProps = {
  idleLabel: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
};

export function PendingSubmitButton({
  idleLabel,
  pendingLabel = "در حال ذخیره…",
  variant,
  size,
  className,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
      ) : null}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
