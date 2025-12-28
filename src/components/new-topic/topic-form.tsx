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
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Checkbox } from "@/components/ui/checkbox"

type TopicFormData = {
  title: string
  categoryId: string
  content: string
  tags: string[]
  isPinned?: boolean
  isCommunity?: boolean
}

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => void
  isSubmitting?: boolean
  onCancel?: () => void
}

export type { TopicFormData }
export function TopicForm({
  onSubmit,
  isSubmitting = false,
  onCancel,
}: TopicFormProps) {
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
        isPinned: z.boolean().optional(),
        isCommunity: z.boolean().optional(),
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
      isPinned: false,
      isCommunity: false,
    },
  })

  type MeResponse = {
    user: { id: string; email?: string | null; isAdmin?: boolean }
    profile?: {
      id: string
      email: string
      username: string
      avatar?: string | null
    } | null
  } | null
  const fetcher = async (url: string): Promise<MeResponse> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as MeResponse
  }
  const { data: me } = useSWR<MeResponse>("/api/auth/me", fetcher)
  const isAdmin = me?.user?.isAdmin === true

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

        <div className="flex flex-row justify-between gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.category.label")}</FormLabel>
                <FormControl>
                  <CategorySelect
                    className="w-36"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                  />
                </FormControl>
                <FormDescription>{t("form.category.info")}</FormDescription>
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
                    className="w-36"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("form.tags.placeholder")}
                  />
                </FormControl>
                <FormDescription>
                  {t("form.tags.info", {
                    used: field.value.length,
                    max: 5,
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

        {isAdmin && (
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                      aria-label={t("form.isPinned.label")}
                    />
                  </FormControl>
                  <FormLabel className="m-0">
                    {t("form.isPinned.label")}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isCommunity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                      aria-label={t("form.isCommunity.label")}
                    />
                  </FormControl>
                  <FormLabel className="m-0">
                    {t("form.isCommunity.label")}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t("form.actions.cancel")}
            </Button>
          )}
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
