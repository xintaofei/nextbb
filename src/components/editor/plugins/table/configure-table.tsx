import { Editor } from "@milkdown/kit/core"
import { tableBlockConfig } from "@milkdown/kit/component/table-block"
import { renderToStaticMarkup } from "react-dom/server"
import {
  Plus,
  Trash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  GripVertical,
} from "lucide-react"

type EditorType = ReturnType<typeof Editor.make>
type ConfigFn = Parameters<EditorType["config"]>[0]
type Ctx = Parameters<ConfigFn>[0]

type RenderType =
  | "add_row"
  | "add_col"
  | "delete_row"
  | "delete_col"
  | "align_col_left"
  | "align_col_center"
  | "align_col_right"
  | "col_drag_handle"
  | "row_drag_handle"

export const configureTable = (ctx: Ctx) => {
  ctx.set(tableBlockConfig.key, {
    renderButton: (renderType: RenderType) => {
      const iconClass = "w-4 h-4"
      const buttonClass =
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-6 w-6 border border-input bg-background shadow-sm hover:text-accent-foreground cursor-pointer"

      let icon
      let title
      switch (renderType) {
        case "add_row":
          icon = <Plus className={iconClass} />
          title = "Add Row"
          break
        case "add_col":
          icon = <Plus className={iconClass} />
          title = "Add Column"
          break
        case "delete_row":
          icon = <Trash className={`${iconClass} text-destructive`} />
          title = "Delete Row"
          break
        case "delete_col":
          icon = <Trash className={`${iconClass} text-destructive`} />
          title = "Delete Column"
          break
        case "align_col_left":
          icon = <AlignLeft className={iconClass} />
          title = "Align Left"
          break
        case "align_col_center":
          icon = <AlignCenter className={iconClass} />
          title = "Align Center"
          break
        case "align_col_right":
          icon = <AlignRight className={iconClass} />
          title = "Align Right"
          break
        case "col_drag_handle":
          icon = <GripVertical className={iconClass} />
          title = "Drag Column"
          break
        case "row_drag_handle":
          icon = <GripVertical className={iconClass} />
          title = "Drag Row"
          break
      }

      if (!icon) return ""

      return renderToStaticMarkup(
        <div className={buttonClass} title={title}>
          {icon}
        </div>
      )
    },
  })
}
