"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "cn"

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  wrapperClassName?: string
}

function PasswordInput({
  className,
  wrapperClassName,
  visible: visibleProp,
  onVisibleChange,
  disabled,
  ...props
}: PasswordInputProps) {
  const [uncontrolledVisible, setUncontrolledVisible] = React.useState(false)
  const isControlled = visibleProp !== undefined
  const visible = isControlled ? visibleProp : uncontrolledVisible

  function toggleVisibility() {
    const next = !visible
    if (!isControlled) setUncontrolledVisible(next)
    onVisibleChange?.(next)
  }

  return (
    <div className={cn("relative min-w-0", wrapperClassName ?? "w-full")} dir="ltr">
      <Input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={toggleVisibility}
        aria-label={visible ? "مخفی کردن رمز" : "نمایش رمز"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
