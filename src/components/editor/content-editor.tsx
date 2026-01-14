import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  schemaCtx,
  serializerCtx,
} from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { gfm } from "@milkdown/kit/preset/gfm"
import { history } from "@milkdown/kit/plugin/history"
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import { nord } from "@milkdown/theme-nord"
import { replaceAll } from "@milkdown/kit/utils"
import { DOMSerializer, Node } from "@milkdown/kit/prose/model"
import React, { useEffect, useRef } from "react"

interface MilkdownEditorProps {
  value?: string
  onChange?: (
    value: string,
    json?: Record<string, unknown>,
    html?: string
  ) => void
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ value, onChange }) => {
  const valueRef = useRef(value)
  const { get, loading } = useEditor(
    (root) =>
      Editor.make()
        .config(nord)
        .config((ctx) => {
          ctx.set(rootCtx, root)

          // Try to parse as JSON first
          let initialContent: string | Record<string, unknown> = value || ""
          try {
            const parsed = JSON.parse(initialContent as string)
            if (parsed && parsed.type === "doc" && parsed.content) {
              initialContent = parsed
            }
          } catch (e) {
            // Not JSON, treat as markdown
          }

          if (typeof initialContent === "string") {
            ctx.set(defaultValueCtx, initialContent)
          } else {
            // If it's JSON, we handle it in useEffect or separate action
            // But defaultValueCtx only accepts string (markdown) usually
            // So we might need to rely on the useEffect below to set JSON content
            // For now, let's leave defaultValueCtx empty if JSON, and let useEffect handle it
          }

          if (onChange) {
            const l = ctx.get(listenerCtx)
            l.updated((ctx, doc) => {
              const view = ctx.get(editorViewCtx)
              if (!view) return

              // 1. JSON
              const json = doc.toJSON()

              // 2. HTML
              const schema = ctx.get(schemaCtx)
              const domSerializer = DOMSerializer.fromSchema(schema)
              const fragment = domSerializer.serializeFragment(doc.content)
              const tmp = document.createElement("div")
              tmp.appendChild(fragment)
              const html = tmp.innerHTML

              // 3. Markdown (Legacy/Fallback)
              const markdownSerializer = ctx.get(serializerCtx)
              const markdown = markdownSerializer(doc)

              valueRef.current = JSON.stringify(json) // Store internal value as JSON string for ref comparison?
              // Actually we should store what we pass out.
              // If we pass out markdown as primary, keep markdown.
              // But we want to switch to JSON.
              // Let's pass JSON string as primary value to onChange for 'value'.

              // Wait, existing forms expect string.
              // If we change the first arg to be JSON string, we might break things if they expect Markdown.
              // But the requirement is "content存milkdown的json".
              // So the 'value' passed back should be JSON string.
              onChange(JSON.stringify(json), json, html)
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
    if (loading || value === undefined) return

    // Check if value is essentially same as ref to avoid loop
    // Since we now work with JSON string as value, simple string comparison might work
    if (value === valueRef.current) return

    const editor = get()
    if (editor) {
      let content: string | Record<string, unknown> = value
      try {
        const parsed = JSON.parse(value)
        if (parsed && parsed.type === "doc") {
          content = parsed
        }
      } catch {}

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
