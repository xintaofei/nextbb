import { $node } from "@milkdown/kit/utils"
import { Node, NodeType } from "@milkdown/kit/prose/model"
import { ParserState, SerializerState } from "@milkdown/kit/transformer"

export const mentionNode = $node("mention", () => ({
  group: "inline",
  inline: true,
  atom: true,
  attrs: {
    id: { default: "" },
    label: { default: "user" },
  },
  parseDOM: [
    {
      tag: "span[data-type='mention']",
      getAttrs: (dom: HTMLElement | string) => {
        if (dom instanceof HTMLElement) {
          const text = dom.innerText
          return {
            id: dom.getAttribute("data-id") || "",
            label: text.startsWith("@") ? text.slice(1) : text,
          }
        }
        return {}
      },
    },
  ],
  toDOM: (node: Node) => {
    return [
      "span",
      {
        "data-type": "mention",
        "data-id": node.attrs.id,
        class: "text-blue-500 font-medium mx-0.5",
      },
      `@${node.attrs.label}`,
    ]
  },
  parseMarkdown: {
    match: (node: { type: string; value?: unknown }) =>
      node.type === "text" && /(?:^|\s)@\w+/.test((node.value as string) || ""),
    runner: (
      state: ParserState,
      node: { type: string; value?: unknown },
      type: NodeType
    ) => {
      const value = node.value as string
      const regex = /(?:^|\s)(@\w+)/g
      let lastIndex = 0
      let match

      while ((match = regex.exec(value)) !== null) {
        const fullMatch = match[0]
        const mention = match[1]
        const start = match.index

        const mentionStart = start + (fullMatch.length - mention.length)

        if (mentionStart > lastIndex) {
          state.addText(value.slice(lastIndex, mentionStart))
        }

        const label = mention.slice(1)
        state.addNode(type, { label, id: label })
        lastIndex = regex.lastIndex
      }

      if (lastIndex < value.length) {
        state.addText(value.slice(lastIndex))
      }
    },
  },
  toMarkdown: {
    match: (node: Node) => node.type.name === "mention",
    runner: (state: SerializerState, node: Node) => {
      state.addNode("text", undefined, `@${node.attrs.label}`)
    },
  },
}))
