"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CategorySelect } from "@/components/filters/category-select"
import { TagsMultiSelect } from "@/components/filters/tags-multi-select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import { TopicType } from "@/types/topic-type"
import { cn } from "@/lib/utils"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

const MilkdownEditorWrapper = dynamic(
  () =>
    import("@/components/editor/content-editor").then(
      (mod) => mod.MilkdownEditorWrapper
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-28 w-full rounded-md" />,
  }
)

type QuickPostFormProps = {
  onPublished?: () => void
}

const quickPostSchema = z.object({
  title: z.string().min(5).max(100),
  categoryId: z.string().regex(/^\d+$/),
  content: z.string().min(20).max(5000),
  content_html: z.string(),
  tags: z.array(z.string().max(15)).max(5),
})

type QuickPostFormValues = z.infer<typeof quickPostSchema>

export function QuickPostForm({ onPublished }: QuickPostFormProps) {
  const t = useTranslations("Topic.QuickPost")
  const tNew = useTranslations("Topic.New")
  const { isAuthenticated } = useCurrentUser()
  const router = useRouter()

  const [expanded, setExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const form = useForm<QuickPostFormValues>({
    resolver: zodResolver(quickPostSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      content: "",
      content_html: "",
      tags: [],
    },
  })

  const handleExpand = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    setExpanded(true)
  }, [isAuthenticated, router])

  const handleCancel = useCallback(() => {
    form.reset()
    setExpanded(false)
  }, [form])

  const handleSubmit = useCallback(
    async (data: QuickPostFormValues) => {
      setIsSubmitting(true)
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            type: TopicType.GENERAL,
            isPinned: false,
            isCommunity: false,
          }),
        })
        if (!res.ok) {
          if (res.status === 401) {
            toast.error(t("unauthorized"))
            return
          }
          const err: { error?: string } = await res.json().catch(() => ({}))
          toast.error(err?.error ? `${t("failed")}: ${err.error}` : t("failed"))
          return
        }
        toast.success(t("success"))
        form.reset()
        setExpanded(false)
        onPublished?.()
      } catch {
        toast.error(t("failed"))
      } finally {
        setIsSubmitting(false)
      }
    },
    [t, form, onPublished]
  )

  // 收起状态：占位符
  if (!expanded) {
    return (
      <div className="border-y bg-muted/40 max-sm:border max-sm:rounded-lg">
        <button
          type="button"
          onClick={handleExpand}
          className={cn(
            "w-full px-4 py-3 text-left text-lg",
            "hover:bg-muted/50 transition-colors cursor-text"
          )}
        >
          {isAuthenticated ? t("placeholder") : t("goLogin")}
        </button>
      </div>
    )
  }

  // 展开状态：完整表单
  return (
    <div className="border-y bg-background max-sm:border max-sm:rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* 标题 */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="p-3 border-b">
                <FormControl>
                  <Input
                    placeholder={t("titlePlaceholder")}
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 内容编辑器 */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MilkdownEditorWrapper
                    value={field.value}
                    isBorder={false}
                    placeholder={tNew("form.content.placeholder")}
                    onChange={(val, _json, html) => {
                      field.onChange(val)
                      if (html) {
                        form.setValue("content_html", html)
                      }
                    }}
                    onPendingChange={setIsSyncing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 分类 + 标签 + 按钮 */}
          <div className="flex items-center gap-2 flex-wrap p-3">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="shrink-0">
                  <FormControl>
                    <CategorySelect
                      className="min-w-32"
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
                <FormItem className="shrink-0">
                  <FormControl>
                    <TagsMultiSelect
                      className="min-w-32"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={tNew("form.tags.placeholder")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isSyncing}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("publishing")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("publish")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
