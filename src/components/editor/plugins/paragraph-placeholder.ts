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
          const { selection } = state
          const decorations: Decoration[] = []

          // Check if the document is effectively empty (only one empty paragraph)
          const isDocEmpty =
            doc.childCount === 1 &&
            doc.firstChild?.type.name === "paragraph" &&
            doc.firstChild?.content.size === 0

          doc.descendants((node, pos) => {
            if (node.type.name === "paragraph" && node.content.size === 0) {
              const isFocused = selection.from === pos + 1

              if (isDocEmpty) {
                // If doc is empty, show main placeholder on the first line
                if (text) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: "paragraph-placeholder",
                      "data-placeholder": text,
                    })
                  )
                }
              } else {
                // If doc is not empty, show slash placeholder on empty lines ONLY if focused
                if (secondaryText && isFocused) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: "paragraph-placeholder",
                      "data-placeholder": secondaryText,
                    })
                  )
                }
              }
            }
          })

          return DecorationSet.create(doc, decorations)
        },
      },
    })
  })
