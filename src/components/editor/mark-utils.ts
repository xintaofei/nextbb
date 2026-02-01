import type { Ctx } from "@milkdown/ctx"
import { editorViewCtx, schemaCtx } from "@milkdown/kit/core"
import type { MarkType } from "@milkdown/kit/prose/model"

export const toggleMarkInEditor = (
  ctx: Ctx,
  getMarkFn: (schema: unknown) => unknown
) => {
  const view = ctx.get(editorViewCtx)
  const { state, dispatch } = view
  const schema = ctx.get(schemaCtx)

  const markType = getMarkFn(schema) as MarkType | null | undefined
  if (!markType) return

  const { from, to, empty } = state.selection

  // Detect if mark is active
  let isActive = false
  if (empty) {
    // Empty selection: check storedMarks or marks at cursor position
    const storedMarks = state.storedMarks || state.selection.$from.marks()
    isActive = storedMarks.some((m) => m.type === markType)
  } else {
    // Range selection: check if all text in range has the mark
    isActive = true
    let hasText = false
    state.doc.nodesBetween(from, to, (node) => {
      // Only check text nodes
      if (node.isText) {
        hasText = true
        // Check if this text node has the mark
        if (!node.marks.some((m) => m.type === markType)) {
          isActive = false
          return false // Stop iteration
        }
      }
      return true
    })
    // If no text in selection, mark is not active
    if (!hasText) isActive = false
  }

  const tr = state.tr
  if (empty) {
    if (isActive) {
      tr.removeStoredMark(markType)
    } else {
      tr.addStoredMark(markType.create())
    }
  } else {
    if (isActive) {
      tr.removeMark(from, to, markType)
    } else {
      tr.addMark(from, to, markType.create())
    }
  }
  dispatch(tr)
  view.focus()
}
