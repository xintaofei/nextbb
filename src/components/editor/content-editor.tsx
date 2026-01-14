import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  schemaCtx,
} from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { gfm } from "@milkdown/kit/preset/gfm"
import { history } from "@milkdown/kit/plugin/history"
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener"
import { clipboard } from "@milkdown/kit/plugin/clipboard"
import { indent } from "@milkdown/kit/plugin/indent"
import { cursor } from "@milkdown/kit/plugin/cursor"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import { nord } from "@milkdown/theme-nord"
import { replaceAll } from "@milkdown/kit/utils"
import { DOMSerializer, Node } from "@milkdown/kit/prose/model"
import React, { useEffect, useRef, useCallback } from "react"
import { useDebouncedCallback } from "@/hooks/use-debounce"

type EditorType = ReturnType<typeof Editor.make>
type ConfigFn = Parameters<EditorType["config"]>[0]
type Ctx = Parameters<ConfigFn>[0]

interface MilkdownEditorProps {
  value?: string
  onChange?: (
    value: string,
    json?: Record<string, unknown>,
    html?: string
  ) => void
}

const parseContent = (value: string | undefined) => {
  if (!value) return ""
  try {
    const parsed = JSON.parse(value)
    if (parsed && parsed.type === "doc" && parsed.content) {
      return parsed
    }
  } catch {
    // Not JSON, treat as markdown
  }
  return value
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ value, onChange }) => {
  const valueRef = useRef<string | undefined>(undefined)

  const handleUpdate = useCallback(
    (ctx: Ctx, doc: Node) => {
      if (!onChange) return

      // 1. JSON
      const json = doc.toJSON()

      // 2. HTML
      const schema = ctx.get(schemaCtx)
      const domSerializer = DOMSerializer.fromSchema(schema)
      const fragment = domSerializer.serializeFragment(doc.content)
      const tmp = document.createElement("div")
      tmp.appendChild(fragment)
      const html = tmp.innerHTML

      const jsonString = JSON.stringify(json)
      valueRef.current = jsonString
      onChange(jsonString, json, html)
    },
    [onChange]
  )

  // Debounce the update to avoid performance issues on every keystroke
  const debouncedUpdate = useDebouncedCallback(handleUpdate, 500)
  const onUpdateRef = useRef(debouncedUpdate)

  useEffect(() => {
    onUpdateRef.current = debouncedUpdate
  }, [debouncedUpdate])

  const { get, loading } = useEditor(
    (root) =>
      Editor.make()
        .config(nord)
        .config((ctx) => {
          ctx.set(rootCtx, root)

          const initialContent = parseContent(value)
          if (typeof initialContent === "string") {
            ctx.set(defaultValueCtx, initialContent)
          }

          ctx.get(listenerCtx).updated((ctx, doc) => {
            onUpdateRef.current?.(ctx, doc)
          })
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener)
        .use(clipboard)
        .use(indent)
        .use(cursor),
    []
  )

  useEffect(() => {
    if (loading || value === undefined) return
    if (value === valueRef.current) return

    const editor = get()
    if (!editor) return

    const content = parseContent(value)

    if (typeof content === "string") {
      editor.action(replaceAll(content))
    } else {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const schema = ctx.get(schemaCtx)
        const node = Node.fromJSON(schema, content)
        const tr = view.state.tr.replaceWith(
          0,
          view.state.doc.content.size,
          node
        )
        view.dispatch(tr)
      })
    }
    valueRef.current = value
  }, [value, get, loading])

  return <Milkdown />
}

export const MilkdownEditorWrapper: React.FC<MilkdownEditorProps> = (props) => {
  return (
    <MilkdownProvider>
      <div className="w-full prose dark:prose-invert border rounded-lg focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
        <MilkdownEditor {...props} />
      </div>
    </MilkdownProvider>
  )
}
