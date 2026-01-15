export const parseContent = (value: string | undefined) => {
  if (!value) return ""
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
  return value
}

export const calculatePopoverStyle = (
  x: number,
  y: number,
  isOpen: boolean
): React.CSSProperties => {
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
}

import { Ctx } from "@milkdown/kit/ctx"
import { editorViewCtx, schemaCtx } from "@milkdown/kit/core"

export const insertMention = (
  ctx: Ctx,
  user: { id: string; name: string },
  queryLength: number
) => {
  const view = ctx.get(editorViewCtx)
  const { state, dispatch } = view
  const { tr, selection } = state
  const { from } = selection
  const schema = ctx.get(schemaCtx)

  if (!schema.nodes.mention) return

  const node = schema.nodes.mention.create({
    id: user.id,
    label: user.name,
  })

  // Replace @query with mention node + space
  // We assume the trigger is 1 character ("@")
  const start = from - queryLength - 1
  const tr2 = tr.replaceWith(start, from, node)
  const tr3 = tr2.insertText(" ")

  dispatch(tr3)
  view.focus()
}
