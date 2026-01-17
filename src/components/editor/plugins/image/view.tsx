import React, { useState } from "react"
import { useNodeViewContext } from "@prosemirror-adapter/react"
import { Loader2, RefreshCw, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export const ImageView: React.FC = () => {
  const { node, selected } = useNodeViewContext()
  const src = node.attrs.src
  const alt = node.attrs.alt
  const title = node.attrs.title

  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  )
  const [retryKey, setRetryKey] = useState(0)
  const [prevSrc, setPrevSrc] = useState(src)

  // Reset status when src changes
  if (src !== prevSrc) {
    setPrevSrc(src)
    setStatus("loading")
    setRetryKey(0)
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setStatus("loading")
    setRetryKey((prev) => prev + 1)
  }

  const currentSrc =
    retryKey > 0
      ? `${src}${src.includes("?") ? "&" : "?"}retry=${retryKey}`
      : src

  return (
    <div
      className={`relative inline-block max-w-full rounded-md overflow-hidden transition-all duration-200 ${
        selected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <Image
        src={currentSrc}
        alt={alt || ""}
        title={title}
        width={0}
        height={0}
        sizes="100vw"
        unoptimized
        className={`max-w-full h-auto transition-opacity duration-300 ${
          status === "success"
            ? "opacity-100"
            : "opacity-0 absolute top-0 left-0"
        }`}
        onLoad={() => setStatus("success")}
        onError={() => setStatus("error")}
      />

      {status === "loading" && (
        <div className="flex items-center justify-center bg-muted/50 min-h-[100px] min-w-[100px] rounded-md">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center bg-muted/20 border border-border min-h-[150px] min-w-[200px] p-4 gap-2 rounded-md">
          <ImageOff className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">图片加载失败</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="h-8 gap-2 bg-background/80 hover:bg-background"
          >
            <RefreshCw className="w-3 h-3" />
            重试
          </Button>
        </div>
      )}
    </div>
  )
}
