import { useEffect, useState, useCallback, useRef } from "react"
import { editorViewCtx } from "@milkdown/kit/core"
import type { Ctx } from "@milkdown/ctx"
import type { EditorState } from "@milkdown/kit/prose/state"

export interface ToolbarState {
  bold: boolean
  italic: boolean
  strikethrough: boolean
  code: boolean
  headingLevel: number | null
  isBulletList: boolean
  isOrderedList: boolean
  isBlockquote: boolean
  isCodeBlock: boolean
}

interface EditorInstance {
  action: (fn: (ctx: Ctx) => void) => void
}
import { MarkType } from "@milkdown/kit/prose/model"

/**
 * Check multiple marks active state in a single pass
 */
const checkMarksActive = (
  state: EditorState,
  marksMap: Record<string, string[]>
): Record<string, boolean> => {
  const { from, to, empty } = state.selection
  const markTypes: Record<string, MarkType> = {}

  // Resolve mark types
  Object.entries(marksMap).forEach(([key, names]) => {
    for (const name of names) {
      if (state.schema.marks[name]) {
        markTypes[key] = state.schema.marks[name]
        break
      }
    }
  })

  const result: Record<string, boolean> = {}
  const keys = Object.keys(markTypes)

  // Initialize all to false
  keys.forEach((key) => {
    result[key] = false
  })

  if (keys.length === 0) return result

  // Empty selection: check storedMarks
  if (empty) {
    const storedMarks = state.storedMarks || state.selection.$from.marks()
    keys.forEach((key) => {
      const type = markTypes[key]
      result[key] = storedMarks.some((m) => m.type === type)
    })
    return result
  }

  // Range selection: check if all text in range has the mark
  // We need to track which marks are NOT fully covering the range
  const missingMarks = new Set<string>()

  let hasText = false
  state.doc.nodesBetween(from, to, (node) => {
    // If we already failed all marks, stop traversal
    if (missingMarks.size === keys.length) return false

    if (node.isText) {
      hasText = true
      keys.forEach((key) => {
        if (missingMarks.has(key)) return // Already failed this mark

        const type = markTypes[key]
        if (!node.marks.some((m) => m.type === type)) {
          missingMarks.add(key)
        }
      })
    }
    return true
  })

  // If no text, no marks are active
  if (!hasText) return result

  // A mark is active if it's not in the missing set
  keys.forEach((key) => {
    result[key] = !missingMarks.has(key)
  })

  return result
}

export const useToolbarState = (
  getEditor: () => EditorInstance | undefined
): ToolbarState => {
  const [state, setState] = useState<ToolbarState>({
    bold: false,
    italic: false,
    strikethrough: false,
    code: false,
    headingLevel: null,
    isBulletList: false,
    isOrderedList: false,
    isBlockquote: false,
    isCodeBlock: false,
  })

  // Use ref to track RAF ID for cleanup and previous selection state
  const rafIdRef = useRef<number | null>(null)
  const prevSelectionRef = useRef<{ from: number; to: number } | null>(null)

  const updateState = useCallback(
    (force = false) => {
      const editor = getEditor()
      if (!editor) return

      editor.action((ctx: Ctx) => {
        const view = ctx.get(editorViewCtx)
        if (!view) return

        const { state: editorState } = view
        const { selection } = editorState
        const { from, to } = selection

        // Performance optimization: Skip update if selection hasn't changed (unless forced)
        if (
          !force &&
          prevSelectionRef.current &&
          prevSelectionRef.current.from === from &&
          prevSelectionRef.current.to === to
        ) {
          return
        }

        // Update cache
        prevSelectionRef.current = { from, to }

        // Use precise mark detection - pass multiple possible names to avoid double traversal
        const { bold, italic, strikethrough, code } = checkMarksActive(
          editorState,
          {
            bold: ["strong"],
            italic: ["em", "emphasis"],
            strikethrough: ["strike_through"],
            code: ["inlineCode"],
          }
        )

        // Check block types
        const node = selection.$from.parent
        let headingLevel: number | null = null
        let isBulletList = false
        let isOrderedList = false
        let isBlockquote = false
        let isCodeBlock = false

        if (node.type.name === "heading") {
          headingLevel = node.attrs.level || null
        } else if (node.type.name === "paragraph") {
          headingLevel = null
        }

        // Check if inside list (single loop for both types)
        for (let d = selection.$from.depth; d > 0; d--) {
          const parent = selection.$from.node(d)
          if (parent.type.name === "bullet_list") {
            isBulletList = true
            break
          }
          if (parent.type.name === "ordered_list") {
            isOrderedList = true
            break
          }
        }

        // Check for blockquote
        for (let d = selection.$from.depth; d > 0; d--) {
          const parent = selection.$from.node(d)
          if (parent.type.name === "blockquote") {
            isBlockquote = true
            break
          }
        }

        // Check for code block
        if (node.type.name === "code_block") {
          isCodeBlock = true
        }

        const newState = {
          bold,
          italic,
          strikethrough,
          code,
          headingLevel,
          isBulletList,
          isOrderedList,
          isBlockquote,
          isCodeBlock,
        }

        setState((prevState) => {
          // Shallow comparison to avoid unnecessary re-renders
          const isSame =
            prevState.bold === newState.bold &&
            prevState.italic === newState.italic &&
            prevState.strikethrough === newState.strikethrough &&
            prevState.code === newState.code &&
            prevState.headingLevel === newState.headingLevel &&
            prevState.isBulletList === newState.isBulletList &&
            prevState.isOrderedList === newState.isOrderedList &&
            prevState.isBlockquote === newState.isBlockquote &&
            prevState.isCodeBlock === newState.isCodeBlock

          return isSame ? prevState : newState
        })
      })
    },
    [getEditor]
  )

  // Debounced update using requestAnimationFrame
  const scheduleUpdate = useCallback(
    (force = false) => {
      // Cancel any pending update
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }

      // Schedule new update
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        updateState(force)
      })
    },
    [updateState]
  )

  useEffect(() => {
    const editor = getEditor()
    if (!editor) return

    // Initial state update
    updateState(true)

    // Get the editor view DOM element and its parent container
    let editorDom: HTMLElement | null = null
    let containerDom: HTMLElement | null = null
    editor.action((ctx: Ctx) => {
      const view = ctx.get(editorViewCtx)
      if (view) {
        editorDom = view.dom
        // Get the toolbar container (parent of editor)
        containerDom = editorDom.closest(".prose")?.parentElement || null
      }
    })

    if (!editorDom) return

    // Store references for event listeners (TypeScript needs explicit typing)
    const editorElement: HTMLElement = editorDom
    const targetElement: HTMLElement = containerDom || editorDom

    // Selection change - use cache check (most frequent event)
    const handleSelectionChange = () => {
      scheduleUpdate(false)
    }

    // Keyboard input - force update as content may have changed
    const handleKeyUp = () => {
      scheduleUpdate(true)
    }

    // Mouse click - force update as format may have changed (toolbar clicks)
    const handleMouseUp = () => {
      scheduleUpdate(true)
    }

    // Use event-driven updates with RAF-based debouncing
    document.addEventListener("selectionchange", handleSelectionChange)
    editorElement.addEventListener("keyup", handleKeyUp)
    targetElement.addEventListener("mouseup", handleMouseUp)

    return () => {
      // Clean up event listeners
      document.removeEventListener("selectionchange", handleSelectionChange)
      editorElement.removeEventListener("keyup", handleKeyUp)
      targetElement.removeEventListener("mouseup", handleMouseUp)

      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      // Clear cache
      prevSelectionRef.current = null
    }
  }, [getEditor, updateState, scheduleUpdate])

  return state
}
