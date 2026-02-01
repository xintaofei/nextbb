import type { Ctx } from "@milkdown/ctx"
import { editorViewCtx, schemaCtx } from "@milkdown/kit/core"
import type { Mark, MarkType } from "@milkdown/kit/prose/model"

export const toggleMarkInEditor = (
  ctx: Ctx,
  getMarkFn: (schema: unknown) => unknown
) => {
  const view = ctx.get(editorViewCtx)
  const { state, dispatch } = view
  const schema = ctx.get(schemaCtx)

  const markType = getMarkFn(schema) as MarkType | null | undefined
  if (!markType) return

  const marks = (state.storedMarks || []) as Mark[]
  const isActive = marks.some((m) => m.type.name === markType.name)

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
