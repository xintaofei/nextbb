import { useCallback } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Decoration } from "@milkdown/kit/prose/view"
import type { Node as ProseMirrorNode, Mark } from "@milkdown/kit/prose/model"
import type { Schema } from "@milkdown/kit/prose/model"

interface WidgetSpec {
  id?: string
  side?: number
  marks?: readonly Mark[]
  stopEvent?: (event: Event) => boolean
  key?: string
  ignoreSelection?: boolean
  destroy?: (node: Node) => void
  [key: string]: unknown
}

export interface EditorUploadConfig {
  uploader: (files: FileList, schema: Schema) => Promise<ProseMirrorNode[]>
  uploadWidgetFactory: (pos: number, spec?: WidgetSpec) => Decoration
}

export const useEditorUpload = (): EditorUploadConfig => {
  const t = useTranslations("Editor.Upload")

  const uploader = useCallback(
    async (files: FileList, schema: Schema) => {
      const imgs: File[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (!file) continue
        if (!file.type.includes("image")) continue
        imgs.push(file)
      }

      if (imgs.length === 0) return []

      const nodes = await Promise.all(
        imgs.map(async (file) => {
          try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/upload/image", {
              method: "POST",
              body: formData,
            })

            if (!res.ok) {
              const error = await res.json()
              throw new Error(error.error || t("genericError"))
            }

            const { url } = await res.json()

            return schema.nodes.image.create({
              src: url,
              alt: file.name,
              title: file.name,
            })
          } catch (error) {
            console.error("Upload error:", error)
            toast.error(t("error", { name: file.name }))
            throw error
          }
        })
      )

      return nodes
    },
    [t]
  )

  const uploadWidgetFactory = useCallback(
    (pos: number, spec?: WidgetSpec) => {
      const widget = document.createElement("div")
      widget.className =
        "flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded-md my-2"

      const icon = document.createElement("span")
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`

      const text = document.createElement("span")
      text.textContent = t("widgetText")

      widget.appendChild(icon)
      widget.appendChild(text)

      return Decoration.widget(pos, widget, { id: spec?.id })
    },
    [t]
  )

  return {
    uploader,
    uploadWidgetFactory,
  }
}
