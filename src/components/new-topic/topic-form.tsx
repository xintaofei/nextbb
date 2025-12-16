"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagsInput } from "./tags-input"
import { useState } from "react"
import { useMemo } from "react"
import { useTranslations } from "next-intl"

type TopicFormData = {
  title: string
  category: string
  content: string
  tags: string[]
}

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => void
  isSubmitting?: boolean
}

const CATEGORIES = [
  { value: "tech", labelKey: "Topic.Categories.tech" },
  { value: "resource", labelKey: "Topic.Categories.resource" },
  { value: "help", labelKey: "Topic.Categories.help" },
  { value: "chat", labelKey: "Topic.Categories.chat" },
  { value: "announcement", labelKey: "Topic.Categories.announcement" },
]

export type { TopicFormData }
export function TopicForm({ onSubmit, isSubmitting = false }: TopicFormProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<TopicFormData | null>(null)
  const t = useTranslations("Topic.New")
  const tv = useTranslations("Topic.Validation")
  const tTopic = useTranslations("Topic")

  const topicFormSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(5, tv("title.min")).max(100, tv("title.max")),
        category: z.string().min(1, tv("category.required")),
        content: z
          .string()
          .min(20, tv("content.min"))
          .max(5000, tv("content.max")),
        tags: z
          .array(z.string().max(15, tv("tag.maxLength")))
          .max(5, tv("tags.maxCount")),
      }),
    [tv]
  )

  const form = useForm<TopicFormData>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      category: "",
      content: "",
      tags: [],
    },
  })

  const watchedValues = form.watch()
  const titleCount = watchedValues.title?.length || 0
  const contentCount = watchedValues.content?.length || 0

  const handleSubmit = (data: TopicFormData) => {
    onSubmit(data)
  }

  const handlePreview = () => {
    const formData = form.getValues()
    setPreviewData(formData)
    setShowPreview(true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.title.label")}</FormLabel>
              <FormControl>
                <Input placeholder={t("form.title.placeholder")} {...field} />
              </FormControl>
              <FormDescription>
                {t("form.title.counter", { count: titleCount })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.category.label")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.category.placeholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {tTopic(category.labelKey.replace("Topic.", ""))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.content.label")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form.content.placeholder")}
                  className="min-h-[200px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("form.content.counter", { count: contentCount })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.tags.label")}</FormLabel>
              <FormControl>
                <TagsInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("form.tags.placeholder")}
                  infoText={t("form.tags.info", {
                    used: field.value.length,
                    max: 5,
                    maxLength: 15,
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            {t("form.actions.reset")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            disabled={isSubmitting}
          >
            {t("form.actions.preview")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("form.actions.publishing")
              : t("form.actions.publish")}
          </Button>
        </div>

        {showPreview && previewData && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{t("preview.title")}</h3>
            <div className="space-y-2">
              <p>
                <strong>{t("preview.field.title")}</strong> {previewData.title}
              </p>
              <p>
                <strong>{t("preview.field.category")}</strong>{" "}
                {previewData.category
                  ? tTopic(
                      CATEGORIES.find(
                        (c) => c.value === previewData.category
                      )?.labelKey.replace("Topic.", "") || "Categories.tech"
                    )
                  : ""}
              </p>
              <p>
                <strong>{t("preview.field.tags")}</strong>{" "}
                {previewData.tags.join(", ")}
              </p>
              <div>
                <strong>{t("preview.field.content")}</strong>
                <div className="mt-1 whitespace-pre-wrap">
                  {previewData.content}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowPreview(false)}
            >
              {t("preview.close")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
