import { useEffect, useState, useCallback } from "react"
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
 * - Range selection: use rangeHasMark to check if ALL text has the mark
 */
const checkMarkActive = (state: EditorState, markTypeName: string): boolean => {
  const markType = state.schema.marks[markTypeName]
  if (!markType) return false

  // Empty selection: check storedMarks
  if (state.selection.empty) {
    const storedMarks = state.storedMarks || state.selection.$from.marks()
    return storedMarks.some((m) => m.type === markType)
  }

  // Range selection: use rangeHasMark
  return state.doc.rangeHasMark(
    state.selection.$from.pos,
    state.selection.$to.pos,
    markType
  )
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

  const updateState = useCallback(() => {
    const editor = getEditor()
    if (!editor) return

    editor.action((ctx: Ctx) => {
      const view = ctx.get(editorViewCtx)
      if (!view) return

      const { state: editorState } = view
      const { selection } = editorState

      // Use precise mark detection
      const bold = checkMarkActive(editorState, "strong")
      const italic = checkMarkActive(editorState, "em")
      const strikethrough = checkMarkActive(editorState, "strike_through")
      const code = checkMarkActive(editorState, "inlineCode")

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

      // Check if inside list
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
  }, [getEditor])

  useEffect(() => {
    const editor = getEditor()
    if (!editor) return

    // Initial state update
    updateState()

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

    // Update on any selection change (don't filter by anchorNode as toolbar clicks change focus)
    const handleSelectionChange = () => {
      // Use requestAnimationFrame to ensure state is updated after transaction
      requestAnimationFrame(() => {
        updateState()
      })
    }

    // Handle keyboard events in editor
    const handleKeyUp = () => {
      updateState()
    }

    // Handle mouse events - covers clicks and selection
    const handleMouseUp = () => {
      // Delay slightly to ensure transaction is complete
      requestAnimationFrame(() => {
        updateState()
      })
    }

    // Use event-driven updates
    document.addEventListener("selectionchange", handleSelectionChange)
    editorElement.addEventListener("keyup", handleKeyUp)
    targetElement.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      editorElement.removeEventListener("keyup", handleKeyUp)
      targetElement.removeEventListener("mouseup", handleMouseUp)
    }
  }, [getEditor, updateState])

  return state
}
