import React, { useCallback, useRef, useState, useEffect } from "react"
import { useNodeViewContext } from "@prosemirror-adapter/react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEditorUpload } from "../../use-editor-upload"
import { Upload, Loader2, ArrowRight } from "lucide-react"

export const ImageBlockView: React.FC = () => {
  const { view, getPos } = useNodeViewContext()
  const t = useTranslations("Editor.ImageBlock")
  const { uploader } = useEditorUpload()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Solves hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setLoading(true)
      try {
        const schema = view.state.schema
        const nodes = await uploader(files, schema)

        if (nodes && nodes.length > 0) {
          const pos = getPos()
          if (typeof pos === "number") {
            const tr = view.state.tr.replaceWith(pos, pos + 1, nodes[0])
            view.dispatch(tr)
          }
        }
      } catch (error) {
        console.error("Failed to upload image", error)
      } finally {
        setLoading(false)
      }
    },
    [getPos, uploader, view]
  )

  const handleEmbed = useCallback(() => {
    if (!url) return

    const schema = view.state.schema
    const node = schema.nodes.image.create({
      src: url,
      alt: "Image",
    })

    const pos = getPos()
    if (typeof pos === "number") {
      const tr = view.state.tr.replaceWith(pos, pos + 1, node)
      view.dispatch(tr)
    }
  }, [getPos, url, view])

  if (!isMounted) {
    return (
      <div className="my-3 w-full mx-auto h-10 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="my-3 w-full mx-auto" contentEditable={false}>
      <div className="relative flex items-center w-full rounded-lg border bg-background ring-offset-background focus-within:bg-muted/50">
        {/* Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mx-1 shrink-0 rounded-l-lg text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title={t("upload")}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {t("upload")}
        </Button>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
        />

        {/* Divider */}
        <div className="h-4 w-px bg-border shrink-0" />

        {/* URL Input */}
        <Input
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 px-3"
          placeholder={t("placeholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleEmbed()
            }
          }}
          disabled={loading}
        />

        {/* Embed Button (Conditional) */}
        {url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-r-lg text-primary hover:text-primary/90 hover:bg-muted"
            onClick={handleEmbed}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
