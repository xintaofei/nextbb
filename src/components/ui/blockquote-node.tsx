"use client"

import { cn } from "@/lib/utils"
import { type PlateElementProps, PlateElement } from "platejs/react"

export function BlockquoteElement({
  className,
  ...props
}: PlateElementProps & { className?: string }) {
  return (
    <PlateElement
      as="blockquote"
      className={cn("my-1 border-l-2 pl-6 italic", className)}
      {...props}
    />
  )
}
