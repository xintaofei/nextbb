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
import { upload, uploadConfig } from "@milkdown/kit/plugin/upload"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import {
  ProsemirrorAdapterProvider,
  useNodeViewFactory,
} from "@prosemirror-adapter/react"
import { nord } from "@milkdown/theme-nord"
import { replaceAll, $view, $node } from "@milkdown/kit/utils"
import { DOMSerializer, Node } from "@milkdown/kit/prose/model"
import React, { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { mentionSlash } from "./plugins/mention/plugin"
import { mentionNode } from "./plugins/mention/node"
import { MentionList, MentionListRef } from "./plugins/mention/mention-list"
import { SlashProvider } from "@milkdown/kit/plugin/slash"
import { slashCommandKey } from "./plugins/slash-command/plugin"
import { SlashMenu, SlashMenuRef } from "./plugins/slash-command/slash-menu"
import { setBlockType, wrapIn } from "@milkdown/kit/prose/commands"
import { createSlashProviderConfig, PluginState } from "./slash-provider-config"
import { paragraphPlaceholder } from "./plugins/paragraph-placeholder"
import { useEditorUpload } from "./use-editor-upload"
import { imageBlockNode } from "./plugins/image-block/node"
import { ImageBlockView } from "./plugins/image-block/view"
import { ImageView } from "./plugins/image/view"
import { EditorToolbar } from "./toolbar/editor-toolbar"

type EditorType = ReturnType<typeof Editor.make>
type ConfigFn = Parameters<EditorType["config"]>[0]
type Ctx = Parameters<ConfigFn>[0]

interface MilkdownEditorProps {
  value?: string
  placeholder?: string
  slashPlaceholder?: string
  autoFocus?: boolean
  onChange?: (
    value: string,
    json?: Record<string, unknown>,
    html?: string
  ) => void
  onPendingChange?: (isPending: boolean) => void
}

const parseContent = (value: string | undefined) => {
  if (!value) return ""
  // Optimization: Only try to parse as JSON if it looks like a JSON object
  if (value.trim().startsWith("{")) {
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
  }
  return value
}

const imageBlockStopEvent = (event: Event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return ["INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(target.tagName)
}

const imageBlockIgnoreMutation = () => true

// Define a node to match the commonmark image node ID for view binding
const imageNode = $node("image", () => ({
  group: "block",
  attrs: {
    src: { default: "" },
    alt: { default: null },
    title: { default: null },
  },
  parseDOM: [{ tag: "img[src]" }],
  toDOM: (node) => ["img", node.attrs],
  parseMarkdown: {
    match: ({ type }) => type === "image",
    runner: (state, node, type) => {
      state.addNode(type, {
        src: node.url,
        alt: node.alt,
        title: node.title,
      })
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "image",
    runner: (state, node) => {
      state.addNode("image", undefined, undefined, {
        url: node.attrs.src,
        alt: node.attrs.alt,
        title: node.attrs.title,
      })
    },
  },
}))

const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  value,
  onChange,
  onPendingChange,
  placeholder,
  slashPlaceholder,
  autoFocus,
}) => {
  const valueRef = useRef<string | undefined>(value)
  const onChangeRef = useRef(onChange)
  const onPendingChangeRef = useRef(onPendingChange)

  // Parse initial content once to determine initialization strategy
  const [initialContent] = useState(() => parseContent(value))

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPendingChangeRef.current = onPendingChange
  }, [onPendingChange])

  const mentionListRef = useRef<MentionListRef>(null)
  const [mentionState, setMentionState] = useState<PluginState>({
    open: false,
    x: 0,
    y: 0,
    query: "",
  })

  const slashMenuRef = useRef<SlashMenuRef>(null)
  const [slashState, setSlashState] = useState<PluginState>({
    open: false,
    x: 0,
    y: 0,
    query: "",
  })

  const { uploader, uploadWidgetFactory } = useEditorUpload()
  const nodeViewFactory = useNodeViewFactory()

  // 包装 onChange 以支持防抖
  const {
    debounced: debouncedOnChange,
    isPending,
    cancel: cancelDebounce,
  } = useDebouncedCallback(
    (
      ctx: Ctx,
      doc: Node,
      jsonString: string,
      json: Record<string, unknown>
    ) => {
      const currentOnChange = onChangeRef.current
      if (!currentOnChange) return

      // HTML serialization - done only when debounce fires
      const schema = ctx.get(schemaCtx)
      const domSerializer = DOMSerializer.fromSchema(schema)
      const fragment = domSerializer.serializeFragment(doc.content)
      const tmp = document.createElement("div")
      tmp.appendChild(fragment)
      const html = tmp.innerHTML

      currentOnChange(jsonString, json, html)
    },
    300
  )

  // 记录上一次同步给编辑器的外部 value，用于区分“外部修改”和“防抖期间的旧值回流”
  // If initial content is JSON, we skip defaultValueCtx, so we start "unsynced" (undefined)
  // to force useEffect to load the JSON content.
  // We use a flag to track if initialization is needed for JSON
  const lastSyncedValueRef = useRef(value)
  const isRemoteUpdate = useRef(false)
  const isInitializedRef = useRef(typeof initialContent === "string")

  // 同步 pending 状态给父组件
  useEffect(() => {
    onPendingChangeRef.current?.(isPending)
  }, [isPending])

  const handleUpdate = useCallback(
    (ctx: Ctx, doc: Node) => {
      if (!onChangeRef.current) return

      // Optimization: Skip processing if update was triggered by remote change
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false
        return
      }

      // 1. JSON
      const json = doc.toJSON()
      const jsonString = JSON.stringify(json)

      // Optimize: Check if content actually changed before proceeding
      // This prevents unnecessary HTML serialization and updates
      if (valueRef.current && valueRef.current === jsonString) {
        return
      }

      // 立即更新 Ref，防止光标跳动
      valueRef.current = jsonString
      // 防抖通知父组件
      debouncedOnChange(ctx, doc, jsonString, json)
    },
    [debouncedOnChange]
  )

  const { get, loading } = useEditor(
    (root) =>
      Editor.make()
        .config(nord)
        .config((ctx) => {
          ctx.set(rootCtx, root)

          const content = parseContent(value)
          // Only use defaultValueCtx for string (Markdown) content.
          // For JSON, we load it via useEffect transaction to ensure schema compatibility.
          if (typeof content === "string") {
            ctx.set(defaultValueCtx, content)
          }

          ctx.get(listenerCtx).updated((ctx, doc) => {
            handleUpdate(ctx, doc)
          })

          ctx.set(uploadConfig.key, {
            uploader,
            uploadWidgetFactory,
            enableHtmlFileUploader: false,
          })

          // Configure Mention Slash Plugin
          ctx.set(
            mentionSlash.key,
            createSlashProviderConfig({
              trigger: "@",
              providerFactory: SlashProvider,
              onStateChange: setMentionState,
              ref: mentionListRef,
            })
          )

          // Configure Slash Command Plugin
          ctx.set(
            slashCommandKey.key,
            createSlashProviderConfig({
              trigger: "/",
              providerFactory: SlashProvider,
              onStateChange: setSlashState,
              ref: slashMenuRef,
            })
          )
        })
        .use(commonmark)
        .use(
          $view(imageNode, () =>
            nodeViewFactory({
              component: ImageView,
              stopEvent: imageBlockStopEvent,
              ignoreMutation: imageBlockIgnoreMutation,
            })
          )
        )
        .use(gfm)
        .use(history)
        .use(listener)
        .use(clipboard)
        .use(indent)
        .use(cursor)
        .use(upload)
        .use(imageBlockNode)
        .use(
          $view(imageBlockNode, () =>
            nodeViewFactory({
              component: ImageBlockView,
              stopEvent: imageBlockStopEvent,
              ignoreMutation: imageBlockIgnoreMutation,
            })
          )
        )
        .use(mentionNode)
        .use(mentionSlash)
        .use(slashCommandKey)
        .use(paragraphPlaceholder(placeholder || "", slashPlaceholder)),
    [placeholder, slashPlaceholder, uploader, uploadWidgetFactory]
  )

  useEffect(() => {
    if (loading || value === undefined) return

    // 如果未初始化（是JSON），则忽略检查强制加载
    if (isInitializedRef.current) {
      // 如果当前 value 和上一次同步的值一样，说明不是外部的主动修改（如重置或加载新内容）
      // 此时即使 value !== valueRef.current，也只是因为防抖还没结束，不应该同步回编辑器
      if (value === lastSyncedValueRef.current) return

      // 走到这里说明外部真正改变了内容（例如点击了重置按钮），需要取消当前的防抖并同步
      cancelDebounce()

      if (value === valueRef.current) {
        lastSyncedValueRef.current = value
        return
      }
    }

    const editor = get()
    if (!editor) return

    const content = parseContent(value)

    if (typeof content === "string") {
      isRemoteUpdate.current = true
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
        isRemoteUpdate.current = true
        Promise.resolve().then(() => view.dispatch(tr))
      })
    }
    valueRef.current = value
    lastSyncedValueRef.current = value
    isInitializedRef.current = true
  }, [value, get, loading, cancelDebounce])

  useEffect(() => {
    if (!loading && autoFocus) {
      const editor = get()
      if (!editor) return

      // Use requestAnimationFrame to ensure the editor is ready and visible
      // This is more reliable than setTimeout for focus management in React 18+
      const frameId = requestAnimationFrame(() => {
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          if (view && !view.hasFocus()) {
            view.focus()
          }
        })
      })

      return () => cancelAnimationFrame(frameId)
    }
  }, [loading, autoFocus, get])

  const calculatePopoverStyle = useCallback(
    (x: number, y: number, isOpen: boolean) => {
      if (!isOpen || typeof window === "undefined") return {}

      const height = 400 // estimated max height
      const gap = 10
      const windowHeight = window.innerHeight
      const bottomSpace = windowHeight - y

      const shouldFlip = bottomSpace < height && y > height

      return {
        position: "fixed" as const,
        left: `${x}px`,
        zIndex: 99999,
        pointerEvents: "auto" as const,
        ...(shouldFlip
          ? { bottom: `${windowHeight - y + gap}px`, top: "auto" }
          : { top: `${y + gap}px`, bottom: "auto" }),
      }
    },
    []
  )

  // Calculate position for MentionList
  const popoverStyle = useMemo<React.CSSProperties>(
    () =>
      calculatePopoverStyle(mentionState.x, mentionState.y, mentionState.open),
    [mentionState.x, mentionState.y, mentionState.open, calculatePopoverStyle]
  )

  const slashPopoverStyle = useMemo<React.CSSProperties>(
    () => calculatePopoverStyle(slashState.x, slashState.y, slashState.open),
    [slashState.x, slashState.y, slashState.open, calculatePopoverStyle]
  )

  return (
    <>
      <EditorToolbar getEditor={get} />
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
      {slashState.open &&
        typeof document !== "undefined" &&
        createPortal(
          <div style={slashPopoverStyle}>
            <SlashMenu
              ref={slashMenuRef}
              query={slashState.query}
              onClose={() => {
                setSlashState((prev) => ({ ...prev, open: false }))
              }}
              onSelect={(command) => {
                const editor = get()
                if (!editor) return

                editor.action((ctx) => {
                  const view = ctx.get(editorViewCtx)
                  const schema = ctx.get(schemaCtx)

                  // Delete the trigger and query
                  const { selection } = view.state
                  const { from } = selection
                  const tr = view.state.tr.delete(
                    from - slashState.query.length - 1,
                    from
                  )
                  view.dispatch(tr)

                  // Execute command
                  const { state, dispatch } = view

                  switch (command.actionId) {
                    case "h1":
                      setBlockType(schema.nodes.heading, { level: 1 })(
                        state,
                        dispatch
                      )
                      break
                    case "h2":
                      setBlockType(schema.nodes.heading, { level: 2 })(
                        state,
                        dispatch
                      )
                      break
                    case "h3":
                      setBlockType(schema.nodes.heading, { level: 3 })(
                        state,
                        dispatch
                      )
                      break
                    case "h4":
                      setBlockType(schema.nodes.heading, { level: 4 })(
                        state,
                        dispatch
                      )
                      break
                    case "bulletList":
                      wrapIn(schema.nodes.bullet_list)(state, dispatch)
                      break
                    case "orderedList":
                      wrapIn(schema.nodes.ordered_list)(state, dispatch)
                      break
                    case "codeBlock":
                      setBlockType(schema.nodes.code_block)(state, (tr) => {
                        const { $to } = tr.selection
                        const pos = $to.after()
                        const p = schema.nodes.paragraph.createAndFill()
                        if (p) {
                          tr.insert(pos, p)
                        }
                        dispatch(tr)
                      })
                      break
                    case "blockquote":
                      wrapIn(schema.nodes.blockquote)(state, dispatch)
                      break
                    case "hr":
                      const trHr = state.tr.replaceSelectionWith(
                        schema.nodes.hr.create()
                      )
                      dispatch(trHr)
                      break
                    case "image":
                      const trImage = state.tr.replaceSelectionWith(
                        schema.nodes.image_block.create()
                      )
                      dispatch(trImage)
                      break
                  }

                  view.focus()
                  setSlashState((prev) => ({ ...prev, open: false }))
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
      <ProsemirrorAdapterProvider>
        <div className="w-full overflow-hidden prose dark:prose-invert border rounded-lg focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
          <MilkdownEditor {...props} />
        </div>
      </ProsemirrorAdapterProvider>
    </MilkdownProvider>
  )
}
