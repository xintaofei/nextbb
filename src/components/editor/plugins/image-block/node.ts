import { $node } from "@milkdown/kit/utils"

export const imageBlockNode = $node("image_block", () => ({
  group: "block",
  atom: true,
  isolating: true,
  parseDOM: [{ tag: "div[data-type='image-block']" }],
  toDOM: () => ["div", { "data-type": "image-block" }],
  parseMarkdown: {
    match: ({ type }) => type === "image_block",
    runner: (state, node, type) => {
      state.addNode(type)
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "image_block",
    runner: (state, node) => {
      // Do nothing, we don't want to persist the loader
    },
  },
}))
