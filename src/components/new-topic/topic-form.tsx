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
import { CategorySelect } from "@/components/filters/category-select"
import { TagsMultiSelect } from "./tags-multi-select"
import { useState } from "react"
import { useMemo } from "react"
import { useTranslations } from "next-intl"

type TopicFormData = {
  title: string
  categoryId: string
  content: string
  tags: string[]
}

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => void
  isSubmitting?: boolean
}

export type { TopicFormData }
export function TopicForm({ onSubmit, isSubmitting = false }: TopicFormProps) {
  const t = useTranslations("Topic.New")
  const tv = useTranslations("Topic.Validation")

  const topicFormSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(5, tv("title.min")).max(100, tv("title.max")),
        categoryId: z.string().regex(/^\d+$/, tv("category.required")),
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
      categoryId: "",
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.category.label")}</FormLabel>
                <FormControl>
                  <CategorySelect
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                  />
                </FormControl>
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
                  <TagsMultiSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("form.tags.placeholder")}
                  />
                </FormControl>
                <FormDescription>
                  {t("form.tags.info", {
                    used: field.value.length,
                    max: 5,
                    maxLength: 15,
                  })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            {t("form.actions.reset")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("form.actions.publishing")
              : t("form.actions.publish")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
