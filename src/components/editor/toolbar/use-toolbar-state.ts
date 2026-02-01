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
 * - Range selection: check if the entire range has the mark consistently
 */
const checkMarkActive = (state: EditorState, markTypeName: string): boolean => {
  const markType = state.schema.marks[markTypeName]
  if (!markType) return false

  const { from, to, empty } = state.selection

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
      const italic =
        checkMarkActive(editorState, "em") ||
        checkMarkActive(editorState, "emphasis")
      const strikethrough = checkMarkActive(editorState, "strike_through")
      const code = checkMarkActive(editorState, "inlineCode")

      // Debug logging (remove in production)
      if (!selection.empty) {
        console.log("[Toolbar] Selection marks:", {
          bold,
          italic,
          strikethrough,
          code,
          from: selection.from,
          to: selection.to,
        })

        // Debug: Check what marks are actually in the document
        const actualMarks: string[] = []
        editorState.doc.nodesBetween(selection.from, selection.to, (node) => {
          if (node.isText) {
            node.marks.forEach((m) => {
              if (!actualMarks.includes(m.type.name)) {
                actualMarks.push(m.type.name)
              }
            })
          }
        })
        console.log("[Toolbar] Actual marks in selection:", actualMarks)
      }

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
      // Small delay to ensure ProseMirror state is updated
      setTimeout(() => {
        updateState()
      }, 0)
    }

    // Handle keyboard events in editor
    const handleKeyUp = () => {
      updateState()
    }

    // Handle mouse events - covers clicks and selection
    const handleMouseUp = () => {
      // Small delay to ensure transaction is complete
      setTimeout(() => {
        updateState()
      }, 0)
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
