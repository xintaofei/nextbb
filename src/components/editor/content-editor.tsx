import { Editor, rootCtx } from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import { nord } from "@milkdown/theme-nord"
import React from "react"

const MilkdownEditor: React.FC = () => {
  useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root)
      })
      .use(commonmark)
  )

  return <Milkdown />
}

export const MilkdownEditorWrapper: React.FC = () => {
  return (
    <MilkdownProvider>
      <div className="prose dark:prose-invert border rounded-lg focus-within:ring-3 focus-within:ring-muted">
        <MilkdownEditor />
      </div>
    </MilkdownProvider>
  )
}
