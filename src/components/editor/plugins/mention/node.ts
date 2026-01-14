import { $node } from "@milkdown/kit/utils"
import { Node } from "@milkdown/kit/prose/model"

export const mentionNode = $node("mention", () => ({
  schema: () => ({
    group: "inline",
    inline: true,
    atom: true,
    attrs: {
      id: { default: "" },
      label: { default: "" },
    },
    parseDOM: [
      {
        tag: "span[data-type='mention']",
        getAttrs: (dom: HTMLElement | string) => {
          if (!(dom instanceof HTMLElement)) {
            return false
          }
          return {
            id: dom.getAttribute("data-id"),
            label: dom.innerText.slice(1), // Remove @
          }
        },
      },
    ],
    toDOM: (node: Node) => {
      const { id, label } = node.attrs
      return [
        "span",
        {
          "data-type": "mention",
          "data-id": id,
          class: "text-blue-500 font-medium mx-0.5",
        },
        `@${label}`,
      ]
    },
  }),
  parseMarkdown: {
    match: (node: { type: string; value?: unknown }) =>
      node.type === "text" && /@\w+/.test((node.value as string) || ""),
    runner: (state, node: { type: string; value?: unknown }, type) => {
      const value = node.value as string
      const regex = /@(\w+)/g
      let lastIndex = 0
      let match

      while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          state.addText(value.slice(lastIndex, match.index))
        }
        state.addNode(type, { label: match[1], id: match[1] })
        lastIndex = regex.lastIndex
      }

      if (lastIndex < value.length) {
        state.addText(value.slice(lastIndex))
      }
    },
  },
  toMarkdown: {
    match: (node: Node) => node.type.name === "mention",
    runner: (state, node: Node) => {
      state.addNode("text", undefined, `@${node.attrs.label}`)
    },
  },
}))
