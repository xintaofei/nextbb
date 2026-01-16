import React, { useCallback, useRef, useState, useEffect } from "react"
import { useNodeViewContext } from "@prosemirror-adapter/react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEditorUpload } from "../../use-editor-upload"
import { Upload, Loader2, ImageIcon } from "lucide-react"

export const ImageBlockView: React.FC = () => {
  const { view, getPos } = useNodeViewContext()
  const t = useTranslations("Editor.ImageBlock")
  const { uploader } = useEditorUpload()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Solves "flushSync was called from inside a lifecycle method" error
  // by deferring the rendering of Tabs component which likely causes the issue
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

  return (
    <div
      className="my-4 rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl mx-auto p-4 select-none"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <ImageIcon className="w-5 h-5" />
        <span className="font-medium">{t("title")}</span>
      </div>

      {isMounted ? (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t("upload")}</TabsTrigger>
            <TabsTrigger value="link">{t("link")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUpload}
              />
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("uploadInstruction")}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    {t("chooseFile")}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("placeholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEmbed()
                  }
                }}
              />
              <Button onClick={handleEmbed} disabled={!url}>
                {t("embed")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
