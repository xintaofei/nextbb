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
import { EditorView } from "@milkdown/kit/prose/view"
import { EditorState } from "@milkdown/kit/prose/state"
import React, { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { mentionSlash } from "./plugins/mention/plugin"
import { mentionNode } from "./plugins/mention/node"
import { MentionList, MentionListRef } from "./plugins/mention/mention-list"
import { SlashProvider } from "@milkdown/plugin-slash"

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
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type === "doc" &&
      Array.isArray(parsed.content)
    ) {
      return parsed
    }
  } catch {
    // Not JSON, treat as markdown
  }
  return value
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ value, onChange }) => {
  const valueRef = useRef<string | undefined>(undefined)
  const mentionListRef = useRef<MentionListRef>(null)
  const [mentionState, setMentionState] = useState<{
    open: boolean
    x: number
    y: number
    query: string
  }>({
    open: false,
    x: 0,
    y: 0,
    query: "",
  })

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

          // Configure Mention Slash Plugin
          ctx.set(mentionSlash.key, {
            props: {
              handleKeyDown: (_view: EditorView, event: KeyboardEvent) => {
                if (!mentionListRef.current) return false
                return mentionListRef.current.onKeyDown(event)
              },
            },
            view: () => {
              const content = document.createElement("div")
              // Add to body for SlashProvider to use, but we'll use coords for positioning
              content.style.position = "fixed"
              content.style.visibility = "hidden"
              document.body.appendChild(content)

              const provider = new SlashProvider({
                content,
                trigger: ["@"],
              })

              return {
                update: (updatedView: EditorView, prevState?: EditorState) => {
                  provider.update(updatedView, prevState)
                  const query = provider.getContent(updatedView)

                  const { selection } = updatedView.state
                  const { $from } = selection

                  // Check if the current line has an @ before the cursor
                  const textBefore = $from.parent.textBetween(
                    Math.max(0, $from.parentOffset - 50),
                    $from.parentOffset,
                    undefined,
                    "\uFFFC"
                  )

                  const lastAtIndex = textBefore.lastIndexOf("@")

                  // Check if @ is at the start or preceded by whitespace
                  const isAtStart = lastAtIndex === 0
                  const isPrecededBySpace =
                    lastAtIndex > 0 &&
                    /[\s\u00A0]/.test(textBefore[lastAtIndex - 1])

                  const isActive =
                    lastAtIndex !== -1 &&
                    (isAtStart || isPrecededBySpace) &&
                    !textBefore.slice(lastAtIndex + 1).includes(" ")

                  const nextOpen = isActive && typeof query === "string"
                  const nextQuery = isActive
                    ? textBefore.slice(lastAtIndex + 1)
                    : ""

                  if (nextOpen) {
                    // Get actual cursor coordinates only when needed to avoid performance overhead
                    const coords = updatedView.coordsAtPos(selection.from)

                    setMentionState((prev) => {
                      if (
                        prev.open === nextOpen &&
                        prev.query === nextQuery &&
                        prev.x === coords.left &&
                        prev.y === coords.bottom
                      ) {
                        return prev
                      }

                      return {
                        open: nextOpen,
                        x: coords.left,
                        y: coords.bottom,
                        query: nextQuery,
                      }
                    })
                  } else {
                    setMentionState((prev) => {
                      if (!prev.open) return prev
                      return {
                        ...prev,
                        open: false,
                      }
                    })
                  }
                },
                destroy: () => {
                  provider.destroy()
                  content.remove()
                  setMentionState((prev) => ({ ...prev, open: false }))
                },
              }
            },
          })
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener)
        .use(clipboard)
        .use(indent)
        .use(cursor)
        .use(mentionNode)
        .use(mentionSlash),
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

  // Calculate position for MentionList
  const popoverStyle = useMemo<React.CSSProperties>(() => {
    if (mentionState.open) {
      return {
        position: "fixed",
        top: `${mentionState.y + 5}px`,
        left: `${mentionState.x}px`,
        zIndex: 99999,
        pointerEvents: "auto",
      }
    }
    return {}
  }, [mentionState.open, mentionState.x, mentionState.y])

  return (
    <>
      <Milkdown />
      {mentionState.open &&
        typeof document !== "undefined" &&
        createPortal(
          <div style={popoverStyle}>
            <MentionList
              ref={mentionListRef}
              query={mentionState.query}
              onClose={() => {
                setMentionState((prev) => ({ ...prev, open: false }))
              }}
              onSelect={(user) => {
                const editor = get()
                if (!editor) return

                editor.action((ctx) => {
                  const view = ctx.get(editorViewCtx)
                  const { dispatch, state } = view
                  const { tr, selection } = state
                  const { from } = selection

                  // Calculate range to replace
                  const range = {
                    from: from - mentionState.query.length - 1,
                    to: from,
                  }

                  const schema = ctx.get(schemaCtx)
                  if (!schema.nodes.mention) return

                  const node = schema.nodes.mention.create({
                    id: user.id,
                    label: user.name,
                  })

                  const tr2 = tr.replaceWith(range.from, range.to, node)

                  // Add a space after the mention
                  const tr3 = tr2.insertText(" ")

                  dispatch(tr3)
                  view.focus()

                  setMentionState((prev) => ({ ...prev, open: false }))
                })
              }}
            />
          </div>,
          document.body
        )}
    </>
  )
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
