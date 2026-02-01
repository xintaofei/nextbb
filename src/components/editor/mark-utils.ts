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

  // Detect if mark is active
  let isActive
  if (state.selection.empty) {
    // Empty selection: check storedMarks or marks at cursor position
    const storedMarks = state.storedMarks || state.selection.$from.marks()
    isActive = storedMarks.some((m) => m.type === markType)
  } else {
    // Range selection: use rangeHasMark to check if ALL text has the mark
    isActive = state.doc.rangeHasMark(
      state.selection.$from.pos,
      state.selection.$to.pos,
      markType
    )
  }

  const tr = state.tr
  if (state.selection.empty) {
    if (isActive) {
      tr.removeStoredMark(markType)
    } else {
      tr.addStoredMark(markType.create())
    }
  } else {
    if (isActive) {
      tr.removeMark(
        state.selection.$from.pos,
        state.selection.$to.pos,
        markType
      )
    } else {
      tr.addMark(
        state.selection.$from.pos,
        state.selection.$to.pos,
        markType.create()
      )
    }
  }
  dispatch(tr)
  view.focus()
}
