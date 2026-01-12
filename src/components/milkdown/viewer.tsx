"use client"

import React from "react"
import { Milkdown, useEditor } from "@milkdown/react"
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewOptionsCtx,
} from "@milkdown/core"
import { commonmark } from "@milkdown/preset-commonmark"
import { gfm } from "@milkdown/preset-gfm"
import { nord } from "@milkdown/theme-nord"

type MilkdownViewerProps = {
  content: string
  className?: string
}

export const MilkdownViewer: React.FC<MilkdownViewerProps> = ({
  content,
  className,
}) => {
  useEditor(
    (root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root)
          ctx.set(defaultValueCtx, content)
          ctx.update(editorViewOptionsCtx, (prev) => ({
            ...prev,
            editable: () => false,
          }))
        })
        .config(nord)
        .use(commonmark)
        .use(gfm)
    },
    [content]
  )

  return (
    <div className={className}>
      <Milkdown />
    </div>
  )
}
