"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { PlateLeafProps } from "platejs/react"

import { PlateLeaf } from "platejs/react"

export function CodeLeaf({
  className,
  ...props
}: PlateLeafProps & { className?: string }) {
  return (
    <PlateLeaf
      as="code"
      className={cn(
        "whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm",
        className
      )}
      {...props}
    >
      {props.children}
    </PlateLeaf>
  )
}
