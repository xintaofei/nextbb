import { $prose } from "@milkdown/kit/utils"
import { Plugin, PluginKey } from "@milkdown/kit/prose/state"
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view"

export const paragraphPlaceholder = (text: string, secondaryText?: string) =>
  $prose(() => {
    return new Plugin({
      key: new PluginKey("paragraph-placeholder"),
      props: {
        decorations(state) {
          const doc = state.doc
          const decorations: Decoration[] = []

          doc.descendants((node, pos) => {
            if (node.type.name === "paragraph" && node.content.size === 0) {
              const isFirst = pos === 0
              const displayText = isFirst ? text : secondaryText

              console.log("[ParagraphPlaceholder] Processing node:", {
                pos,
                isFirst,
                displayText,
                contentSize: node.content.size,
                nodeType: node.type.name,
              })

              if (displayText) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "paragraph-placeholder",
                    "data-placeholder": displayText,
                  })
                )
              }
            }
          })

          return DecorationSet.create(doc, decorations)
        },
      },
    })
  })
