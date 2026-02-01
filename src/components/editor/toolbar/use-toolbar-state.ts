import { useEffect, useState, useCallback } from "react"
import { editorViewCtx } from "@milkdown/kit/core"
import type { Ctx } from "@milkdown/ctx"
import type { Node as ProseMirrorNode } from "@milkdown/kit/prose/model"

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

interface Mark {
  type: {
    name: string
  }
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
      const { selection, doc, storedMarks } = editorState

      // Check marks on current selection or stored marks
      const marksToCheck: Mark[] = storedMarks ? [...storedMarks] : []
      if (selection && !selection.empty) {
        doc.nodesBetween(
          selection.$from.pos,
          selection.$to.pos,
          (node: ProseMirrorNode) => {
            node.marks.forEach((mark) => {
              if (!marksToCheck.includes(mark)) {
                marksToCheck.push(mark)
              }
            })
          }
        )
      }

      // Check for marks
      let bold = false
      let italic = false
      let strikethrough = false
      let code = false

      marksToCheck.forEach((mark) => {
        if (mark.type.name === "strong") bold = true
        if (mark.type.name === "em") italic = true
        if (mark.type.name === "strike_through") strikethrough = true
        if (mark.type.name === "inlineCode") code = true
      })

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

    // Listen for selection updates
    const interval = setInterval(updateState, 100)

    return () => clearInterval(interval)
  }, [getEditor, updateState])

  return state
}
