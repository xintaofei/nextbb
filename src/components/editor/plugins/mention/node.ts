import { $node } from "@milkdown/kit/utils"
import { Node, NodeType } from "@milkdown/kit/prose/model"
import { ParserState, SerializerState } from "@milkdown/kit/transformer"

export const mentionNode = $node(
  "mention",
  () =>
    ({
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
              return {
                id: dom.getAttribute("data-id") || "",
                label: dom.innerText.slice(1) || "",
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
          node.type === "text" && /@\w+/.test((node.value as string) || ""),
        runner: (
          state: ParserState,
          node: { type: string; value?: unknown },
          type: NodeType
        ) => {
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
        runner: (state: SerializerState, node: Node) => {
          state.addNode("text", undefined, `@${node.attrs.label}`)
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any
)
