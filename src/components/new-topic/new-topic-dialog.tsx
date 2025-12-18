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

interface NewTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTopicDialog({ open, onOpenChange }: NewTopicDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations("Topic.New")

  const handleSubmit = async (data: TopicFormData) => {
    setIsSubmitting(true)
    // 验证阶段仅展示UI，无实际提交
    console.log("话题数据:", data)

    // 模拟提交延迟
    setTimeout(() => {
      setIsSubmitting(false)
      onOpenChange(false)
      // 这里可以添加成功提示
      alert(t("submit.success"))
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <TopicForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}
