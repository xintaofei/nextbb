"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

const avatarBadgeVariants = cva(
  "absolute flex items-center justify-center rounded-full bg-background text-xs ring-2 ring-background",
  {
    variants: {
      position: {
        "bottom-right": "-bottom-0.5 -right-0.5",
        "bottom-left": "-bottom-0.5 -left-0.5",
        "top-right": "-top-0.5 -right-0.5",
        "top-left": "-top-0.5 -left-0.5",
      },
      size: {
        sm: "size-3 text-[0.5rem]",
        md: "size-4 text-[0.625rem]",
        lg: "size-5 text-xs",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      size: "lg",
    },
  }
)

function AvatarBadge({
  className,
  position,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof avatarBadgeVariants>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(avatarBadgeVariants({ position, size, className }))}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, avatarBadgeVariants }
