"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface TopicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic?: {
    id: string
    title: string
    category: {
      id: string
      name: string
    }
    tags: Array<{
      id: string
      name: string
    }>
    isPinned: boolean
    isCommunity: boolean
  }
  categories: Array<{
    id: string
    name: string
    icon: string
  }>
  tags: Array<{
    id: string
    name: string
    icon: string
  }>
  onSubmit: (data: {
    title: string
    categoryId: string
    tagIds: string[]
    isPinned: boolean
    isCommunity: boolean
  }) => Promise<void>
}

export function TopicDialog({
  open,
  onOpenChange,
  topic,
  categories,
  tags,
  onSubmit,
}: TopicDialogProps) {
  const t = useTranslations("AdminTopics.dialog")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    tagIds: [] as string[],
    isPinned: false,
    isCommunity: false,
  })

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title,
        categoryId: topic.category.id,
        tagIds: topic.tags.map((t) => t.id),
        isPinned: topic.isPinned,
        isCommunity: topic.isCommunity,
      })
    } else {
      setFormData({
        title: "",
        categoryId: "",
        tagIds: [],
        isPinned: false,
        isCommunity: false,
      })
    }
  }, [topic, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.categoryId) {
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t("titlePlaceholder")}
              maxLength={256}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("categoryLabel")}</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, categoryId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("tagsLabel")}</Label>
            <div className="flex flex-wrap gap-2 p-3 border border-border/40 rounded-lg">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  size="sm"
                  variant={
                    formData.tagIds.includes(tag.id) ? "default" : "outline"
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.icon} {tag.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <Label htmlFor="pinned">{t("pinnedLabel")}</Label>
            <Switch
              id="pinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPinned: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
            <Label htmlFor="community">{t("communityLabel")}</Label>
            <Switch
              id="community"
              checked={formData.isCommunity}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isCommunity: checked }))
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {t("submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
