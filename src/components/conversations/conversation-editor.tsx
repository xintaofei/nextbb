"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { MilkdownEditorWrapper } from "@/components/editor/content-editor"
import { DrawerEditor } from "@/components/editor/drawer-editor"
import { PenSquare } from "lucide-react"
import useSWRMutation from "swr/mutation"
import { toast } from "sonner"

type ConversationEditorProps = {
  conversationId: string
  onMessageSent?: () => void
}

async function sendMessage(
  url: string,
  { arg }: { arg: { content: string; content_html: string } }
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || "Failed to send message")
  }

  return res.json()
}

export function ConversationEditor({
  conversationId,
  onMessageSent,
}: ConversationEditorProps) {
  const t = useTranslations("Conversations.editor")
  const [value, setValue] = useState("")
  const [html, setHtml] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { trigger } = useSWRMutation(
    `/api/conversations/${conversationId}/messages`,
    sendMessage
  )

  const handleSubmit = async (content: string, contentHtml?: string) => {
    const trimmedContent = content.trim()
    const trimmedHtml = (contentHtml || "").trim()

    if (!trimmedContent) {
      toast.error(t("emptyError"))
      return
    }

    if (trimmedContent.length > 10000) {
      toast.error(t("tooLongError"))
      return
    }

    setSubmitting(true)

    try {
      await trigger({
        content: trimmedContent,
        content_html: trimmedHtml,
      })

      // Clear editor
      setValue("")
      setHtml("")
      setDrawerOpen(false)

      // Trigger callback to refresh messages
      onMessageSent?.()

      toast.success(t("sendSuccess"))
    } catch (error) {
      console.error("Failed to send message:", error)
      if (error instanceof Error) {
        if (error.message.includes("Forbidden")) {
          toast.error(t("sendError"))
        } else if (error.message.includes("fetch")) {
          toast.error(t("networkError"))
        } else {
          toast.error(t("sendError"))
        }
      } else {
        toast.error(t("sendError"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Mobile: Button + DrawerEditor */}
      <div className="md:hidden border-t p-4">
        <Button
          onClick={() => setDrawerOpen(true)}
          className="w-full"
          disabled={submitting}
        >
          <PenSquare className="mr-2 h-4 w-4" />
          {t("writeMessage")}
        </Button>
        <DrawerEditor
          title={t("title")}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          initialValue={value}
          submitting={submitting}
          onSubmit={handleSubmit}
          submitText={t("send")}
          cancelText={t("cancel")}
          placeholder={t("placeholder")}
          slashPlaceholder={t("slashPlaceholder")}
        />
      </div>

      {/* Desktop: Fixed bottom editor */}
      <div className="hidden md:block border-t bg-background">
        <div className="p-4">
          <MilkdownEditorWrapper
            value={value}
            placeholder={t("placeholder")}
            slashPlaceholder={t("slashPlaceholder")}
            onChange={(val, json, h) => {
              setValue(val)
              setHtml(h || "")
            }}
            onPendingChange={setIsSyncing}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setValue("")
                setHtml("")
              }}
              disabled={submitting || !value.trim()}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => handleSubmit(value, html)}
              disabled={submitting || isSyncing || !value.trim()}
            >
              {submitting ? t("sending") : t("send")}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
