"use client"

import * as React from "react"

import type { PlateElementProps } from "platejs/react"

import { PlateElement } from "platejs/react"

import { cn } from "@/lib/utils"

export function ParagraphElement({
  className,
  ...props
}: PlateElementProps & { className?: string }) {
  return (
    <PlateElement
      className={cn("m-0 px-0 py-1", className)}
      {...props}
    >
      {props.children}
    </PlateElement>
  )
}
