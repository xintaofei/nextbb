import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { gfm } from "@milkdown/kit/preset/gfm"
import { history } from "@milkdown/kit/plugin/history"
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import { nord } from "@milkdown/theme-nord"
import { replaceAll } from "@milkdown/kit/utils"
import React, { useEffect, useRef } from "react"

interface MilkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ value, onChange }) => {
  const valueRef = useRef(value)
  const { get, loading } = useEditor(
    (root) =>
      Editor.make()
        .config(nord)
        .config((ctx) => {
          ctx.set(rootCtx, root)
          if (value) {
            ctx.set(defaultValueCtx, value)
          }

          if (onChange) {
            const l = ctx.get(listenerCtx)
            l.markdownUpdated((ctx, markdown) => {
              valueRef.current = markdown
              onChange(markdown)
            })
          }
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener),
    []
  )

  useEffect(() => {
    if (loading || value === undefined || value === valueRef.current) return

    const editor = get()
    if (editor) {
      editor.action(replaceAll(value))
      valueRef.current = value
    }
  }, [value, get, loading])

  return <Milkdown />
}

export const MilkdownEditorWrapper: React.FC<MilkdownEditorProps> = ({
  value,
  onChange,
}) => {
  return (
    <MilkdownProvider>
      <div className="prose dark:prose-invert border rounded-lg focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
        <MilkdownEditor value={value} onChange={onChange} />
      </div>
    </MilkdownProvider>
  )
}
