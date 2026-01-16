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

  // Solves hydration mismatch and "flushSync" issues with Radix UI components
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
      className="my-3 rounded-lg border bg-card text-card-foreground max-w-md mx-auto p-2"
      contentEditable={false}
    >
      {isMounted ? (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="upload" className="text-xs h-6">
              {t("upload")}
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs h-6">
              {t("link")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-2">
            <div
              className="border border-dashed rounded-md p-3 flex flex-row items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
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
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("uploadInstruction")}
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-2">
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
                className="h-9 text-sm"
              />
              <Button
                onClick={handleEmbed}
                disabled={!url}
                size="sm"
                className="h-9"
              >
                {t("embed")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-[80px] w-full flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
    </div>
  )
}
