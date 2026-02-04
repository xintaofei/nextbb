import React, { memo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialUrl?: string
  initialText?: string
  onInsert: (url: string, text?: string) => void
  mode?: "insert" | "edit"
}

export const LinkDialog = memo(
  ({
    open,
    onOpenChange,
    initialUrl = "",
    initialText = "",
    onInsert,
    mode = "insert",
  }: LinkDialogProps) => {
    const t = useTranslations("Editor.Toolbar")
    const [url, setUrl] = useState(initialUrl)
    const [text, setText] = useState(initialText)

    const handleOpenChange = (newOpen: boolean) => {
      if (newOpen) {
        setUrl(initialUrl)
        setText(initialText)
      }
      onOpenChange(newOpen)
    }

    const handleInsert = () => {
      if (!url.trim()) return
      onInsert(url, text || undefined)
      handleOpenChange(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && url.trim()) {
        handleInsert()
      }
    }

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? t("editLink") : t("insertLink")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {mode === "edit" ? t("editLink") : t("insertLink")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">{t("linkUrl")}</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">{t("linkText")}</Label>
              <Input
                id="link-text"
                placeholder={t("linkTextPlaceholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="sm:min-w-20"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!url.trim()}
              className="sm:min-w-20"
            >
              {mode === "edit" ? t("update") : t("insert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

LinkDialog.displayName = "LinkDialog"
