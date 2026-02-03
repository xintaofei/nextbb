import type { Node as ProseMirrorNode } from "@milkdown/kit/prose/model"
import type {
  ParserState,
  SerializerState,
  MarkdownNode,
} from "@milkdown/kit/transformer"
import { $node } from "@milkdown/kit/utils"

export type ExpressionNodeAttrs = {
  src: string
  alt: string | null
  title: string | null
  width: number | null
  height: number | null
}

export const expressionNode = $node("expression", () => ({
  group: "inline",
  inline: true,
  atom: true,
  attrs: {
    src: { default: "" },
    alt: { default: null },
    title: { default: null },
    width: { default: null },
    height: { default: null },
  },
  parseDOM: [
    {
      tag: "img[data-expression]",
    },
  ],
  toDOM: (node: ProseMirrorNode) => {
    const attrs: ExpressionNodeAttrs = node.attrs as ExpressionNodeAttrs
    const domAttrs: Record<string, string | number | undefined> = {
      src: attrs.src,
      alt: attrs.alt ?? undefined,
      title: attrs.title ?? undefined,
      width: attrs.width ?? undefined,
      height: attrs.height ?? undefined,
      "data-expression": "true",
    }

    return ["img", domAttrs]
  },
  parseMarkdown: {
    match: (node: MarkdownNode) =>
      node.type === "image" && node.title === "expression",
    runner: (state: ParserState, node: MarkdownNode, type) => {
      const imageNode = node as MarkdownNode & {
        url?: string
        alt?: string | null
      }
      state.addNode(type, {
        src: imageNode.url ?? "",
        alt: imageNode.alt ?? null,
        title: imageNode.alt ?? null,
        width: null,
        height: null,
      })
    },
  },
  toMarkdown: {
    match: (node: ProseMirrorNode) => node.type.name === "expression",
    runner: (state: SerializerState, node: ProseMirrorNode) => {
      state.addNode("image", undefined, undefined, {
        url: node.attrs.src,
        alt: node.attrs.alt,
        title: "expression",
      })
    },
  },
}))
