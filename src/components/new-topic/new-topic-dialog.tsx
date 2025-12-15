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

interface NewTopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTopicDialog({ open, onOpenChange }: NewTopicDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TopicFormData) => {
    setIsSubmitting(true)
    // 验证阶段仅展示UI，无实际提交
    console.log("话题数据:", data)

    // 模拟提交延迟
    setTimeout(() => {
      setIsSubmitting(false)
      onOpenChange(false)
      // 这里可以添加成功提示
      alert("话题创建成功！（验证阶段演示）")
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建话题</DialogTitle>
          <DialogDescription>
            创建新话题与社区成员分享您的想法
          </DialogDescription>
        </DialogHeader>
        <TopicForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  )
}
