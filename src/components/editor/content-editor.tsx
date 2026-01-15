"use client"

import { Crepe } from "@milkdown/crepe"
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener"
import { SlashProvider } from "@milkdown/kit/plugin/slash"
import { replaceAll } from "@milkdown/kit/utils"
import "@milkdown/crepe/theme/common/style.css"
import "@milkdown/crepe/theme/frame.css"
import React, { useEffect, useRef, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { mentionSlash } from "./plugins/mention/plugin"
import { mentionNode } from "./plugins/mention/node"
import { MentionList, MentionListRef } from "./plugins/mention/mention-list"
import { createSlashProviderConfig, PluginState } from "./slash-provider-config"
import { parseContent, calculatePopoverStyle, insertMention } from "./utils"
import { schemaCtx, editorViewCtx } from "@milkdown/kit/core"
import { DOMSerializer, Node } from "@milkdown/kit/prose/model"
import { Ctx } from "@milkdown/kit/ctx"

interface MilkdownEditorProps {
  value?: string
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
  onChange?: (
    value: string,
    json?: Record<string, unknown>,
    html?: string
  ) => void
}

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  value,
  placeholder = "Write something...",
  onImageUpload,
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const [loading, setLoading] = useState(true)

  // Mention State
  const mentionListRef = useRef<MentionListRef>(null)
  const [mentionState, setMentionState] = useState<PluginState>({
    open: false,
    x: 0,
    y: 0,
    query: "",
  })

  // Value Management
  const valueRef = useRef<string | undefined>(undefined)

  const handleUpdate = React.useCallback(
    (ctx: Ctx, doc: Node) => {
      if (!onChange) return

      // 1. JSON
      const json = doc.toJSON()
      const jsonString = JSON.stringify(json)

      // Optimize: Check if content actually changed before proceeding
      if (valueRef.current && valueRef.current === jsonString) {
        return
      }

      // 2. HTML
      const schema = ctx.get(schemaCtx)
      const domSerializer = DOMSerializer.fromSchema(schema)
      const fragment = domSerializer.serializeFragment(doc.content)
      const tmp = document.createElement("div")
      tmp.appendChild(fragment)
      const html = tmp.innerHTML

      valueRef.current = jsonString
      onChange(jsonString, json, html)
    },
    [onChange]
  )

  const debouncedUpdate = useDebouncedCallback(handleUpdate, 500)
  const onUpdateRef = useRef(debouncedUpdate)
  const onImageUploadRef = useRef(onImageUpload)

  useEffect(() => {
    onUpdateRef.current = debouncedUpdate
  }, [debouncedUpdate])

  useEffect(() => {
    onImageUploadRef.current = onImageUpload
  }, [onImageUpload])

  useEffect(() => {
    if (!editorRef.current) return

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue:
        typeof parseContent(value) === "string"
          ? (parseContent(value) as string)
          : "",
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholder,
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => {
            if (onImageUploadRef.current) {
              return onImageUploadRef.current(file)
            }
            console.warn("Image upload not implemented")
            return URL.createObjectURL(file)
          },
        },
      },
    })

    // Register Mention Plugin
    // Note: Crepe has its own slash command, but we use a custom one for mentions triggered by '@'
    crepe.editor
      .use(mentionNode)
      .use(mentionSlash)
      .use(listener)
      .config((ctx) => {
        // Configure Mention Provider
        ctx.set(
          mentionSlash.key,
          createSlashProviderConfig({
            trigger: "@",
            providerFactory: SlashProvider,
            onStateChange: setMentionState,
            ref: mentionListRef,
          })
        )

        // Configure Listener
        ctx.get(listenerCtx).updated((ctx, doc) => {
          onUpdateRef.current?.(ctx, doc)
        })
      })

    crepe.create().then(() => {
      crepeRef.current = crepe
      setLoading(false)
    })

    return () => {
      crepe.destroy()
      crepeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run once

  // Handle external value changes
  useEffect(() => {
    if (loading || value === undefined) return
    if (value === valueRef.current) return

    const editor = crepeRef.current?.editor
    if (!editor) return

    const content = parseContent(value)

    try {
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
    } catch (error) {
      console.error("Failed to update editor content:", error)
    }
  }, [value, loading])

  // Calculate position for MentionList
  const popoverStyle = useMemo<React.CSSProperties>(
    () =>
      calculatePopoverStyle(mentionState.x, mentionState.y, mentionState.open),
    [mentionState.x, mentionState.y, mentionState.open]
  )

  return (
    <>
      <div
        className="h-full min-h-[300px] milkdown-theme-wrapper"
        ref={editorRef}
      />

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
                const editor = crepeRef.current?.editor
                if (!editor) return

                editor.action((ctx) => {
                  insertMention(ctx, user, mentionState.query.length)
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
    <div className="w-full prose dark:prose-invert border rounded-lg focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all [&_.milkdown-menu]:!static [&_.milkdown]:!shadow-none [&_.milkdown]:!border-none max-w-none">
      <MilkdownEditor {...props} />
    </div>
  )
}
