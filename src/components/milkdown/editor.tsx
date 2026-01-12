"use client"

import React from "react"
import { Milkdown, useEditor, MilkdownProvider } from "@milkdown/react"
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core"
import { commonmark } from "@milkdown/preset-commonmark"
import { gfm } from "@milkdown/preset-gfm"
import { nord } from "@milkdown/theme-nord"
import { listener, listenerCtx } from "@milkdown/plugin-listener"
import { history } from "@milkdown/plugin-history"

type MilkdownEditorProps = {
  value?: string
  onChange?: (markdown: string) => void
  className?: string
}

const MilkdownEditorContent: React.FC<MilkdownEditorProps> = ({
  value = "",
  onChange,
  className,
}) => {
  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
          if (onChange && markdown !== prevMarkdown) {
            onChange(markdown)
          }
        })
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
  }, [])

  return (
    <div className={className}>
      <Milkdown />
    </div>
  )
}

export const MilkdownEditor: React.FC<MilkdownEditorProps> = (props) => {
  return (
    <MilkdownProvider>
      <MilkdownEditorContent {...props} />
    </MilkdownProvider>
  )
}
