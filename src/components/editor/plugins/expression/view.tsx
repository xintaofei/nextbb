import React, { type CSSProperties } from "react"
import { useNodeViewContext } from "@prosemirror-adapter/react"
import type { ExpressionNodeAttrs } from "./node"

export const ExpressionView: React.FC = () => {
  const { node, selected } = useNodeViewContext()
  const attrs: ExpressionNodeAttrs = node.attrs as ExpressionNodeAttrs
  const width: number = typeof attrs.width === "number" ? attrs.width : 32
  const height: number = typeof attrs.height === "number" ? attrs.height : width
  const alt: string = attrs.alt ?? ""
  const title: string | undefined = attrs.title ?? undefined
  const wrapperClassName: string =
    "not-prose inline-flex align-middle leading-none rounded-sm " +
    (selected ? "ring-2 ring-primary ring-offset-2" : "")
  const wrapperStyle: CSSProperties = {
    width,
    height,
    verticalAlign: "middle",
  }

  return (
    <span
      className={wrapperClassName}
      style={wrapperStyle}
      contentEditable={false}
      data-expression="true"
    >
      <img
        src={attrs.src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className="m-0 h-full w-full object-contain align-middle"
      />
    </span>
  )
}
