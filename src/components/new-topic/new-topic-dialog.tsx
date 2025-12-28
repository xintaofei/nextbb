"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TopicForm, TopicFormData } from "@/components/new-topic/topic-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

interface NewTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublished?: (topicId: string) => void
}

export function NewTopicDialog({
  open,
  onOpenChange,
  onPublished,
}: NewTopicDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations("Topic.New")

  const handleSubmit = async (data: TopicFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          categoryId: data.categoryId,
          content: data.content,
          tags: data.tags,
          isPinned: data.isPinned ?? false,
          isCommunity: data.isCommunity ?? false,
        }),
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error(t("submit.unauthorized"))
          return
        }
        const err = await res.json().catch(() => ({}))
        toast.error(
          err?.error
            ? `${t("submit.failed")}: ${err.error}`
            : t("submit.failed")
        )
        return
      }
      const payload: { topicId: string } = await res.json()
      toast.success(t("submit.success"))
      onOpenChange(false)
      onPublished?.(payload.topicId)
      // 可选：跳转到新话题页
      // router.push(`/topic/${payload.topicId}`)
    } catch {
      toast.error(t("submit.failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <TopicForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
