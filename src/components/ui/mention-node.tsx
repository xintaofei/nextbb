"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PlateElement } from "platejs/react"
import type { PlateElementProps } from "platejs/react"

export function MentionElement({
  className,
  ...props
}: PlateElementProps & { className?: string }) {
  const { children, element } = props

  return (
    <PlateElement
      as="span"
      className={cn(
        "inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium",
        className
      )}
      {...props}
    >
      @{element.value}
      {children}
    </PlateElement>
  )
}

export function MentionInputElement({
  className,
  ...props
}: PlateElementProps & { className?: string }) {
  const { children } = props

  return (
    <PlateElement
      as="span"
      className={cn("bg-muted text-muted-foreground", className)}
      {...props}
    >
      {children}
    </PlateElement>
  )
}
