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

/**
 * Check if a mark is active in the current selection
 * - Empty selection: check storedMarks (affects next input)
 * - Range selection: check if the entire range has the mark consistently
 */
const checkMarkActive = (
  state: EditorState,
  markTypeNames: string[]
): boolean => {
  const { from, to, empty } = state.selection

  // Find the first valid mark type
  let markType = null
  for (const name of markTypeNames) {
    if (state.schema.marks[name]) {
      markType = state.schema.marks[name]
      break
    }
  }
  if (!markType) return false

  // Empty selection: check storedMarks or marks at cursor position
  if (empty) {
    const storedMarks = state.storedMarks || state.selection.$from.marks()
    return storedMarks.some((m) => m.type === markType)
  }

  // Range selection: check if all text in range has the mark
  let allHaveMark = true
  let hasText = false
  state.doc.nodesBetween(from, to, (node) => {
    // Only check text nodes
    if (node.isText) {
      hasText = true
      // Check if this text node has the mark
      if (!node.marks.some((m) => m.type === markType)) {
        allHaveMark = false
        return false // Stop iteration - found text without mark
      }
    }
    return true
  })

  return hasText && allHaveMark
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
        const bold = checkMarkActive(editorState, ["strong"])
        const italic = checkMarkActive(editorState, ["em", "emphasis"])
        const strikethrough = checkMarkActive(editorState, ["strike_through"])
        const code = checkMarkActive(editorState, ["inlineCode"])

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

        setState({
          bold,
          italic,
          strikethrough,
          code,
          headingLevel,
          isBulletList,
          isOrderedList,
          isBlockquote,
          isCodeBlock,
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
