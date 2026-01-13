"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { PlateLeafProps } from "platejs/react"

import { PlateLeaf } from "platejs/react"

export function HighlightLeaf({
  className,
  ...props
}: PlateLeafProps & { className?: string }) {
  return (
    <PlateLeaf
      as="mark"
      className={cn("bg-highlight/30 text-inherit", className)}
      {...props}
    >
      {props.children}
    </PlateLeaf>
  )
}
