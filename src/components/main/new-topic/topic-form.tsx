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

const topicFormSchema = z.object({
  title: z
    .string()
    .min(5, "标题至少需要5个字符")
    .max(100, "标题不能超过100个字符"),
  category: z.string().min(1, "请选择分类"),
  content: z
    .string()
    .min(20, "内容至少需要20个字符")
    .max(5000, "内容不能超过5000个字符"),
  tags: z
    .array(z.string().max(15, "单个标签不能超过15个字符"))
    .max(5, "最多5个标签"),
})

type TopicFormData = z.infer<typeof topicFormSchema>

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => void
  isSubmitting?: boolean
}

const CATEGORIES = [
  { value: "tech", label: "技术讨论" },
  { value: "resource", label: "资源分享" },
  { value: "help", label: "求助问答" },
  { value: "chat", label: "闲聊" },
  { value: "announcement", label: "公告" },
]

export type { TopicFormData }
export function TopicForm({ onSubmit, isSubmitting = false }: TopicFormProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<TopicFormData | null>(null)

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
              <FormLabel>话题标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入话题标题" {...field} />
              </FormControl>
              <FormDescription>{titleCount}/100 字符</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>分类</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
              <FormLabel>话题内容</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请详细描述您的话题内容..."
                  className="min-h-[200px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>{contentCount}/5000 字符</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标签</FormLabel>
              <FormControl>
                <TagsInput value={field.value} onChange={field.onChange} />
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
            重置
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            disabled={isSubmitting}
          >
            预览
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "发布中..." : "发布话题"}
          </Button>
        </div>

        {showPreview && previewData && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">预览</h3>
            <div className="space-y-2">
              <p>
                <strong>标题:</strong> {previewData.title}
              </p>
              <p>
                <strong>分类:</strong>{" "}
                {
                  CATEGORIES.find((c) => c.value === previewData.category)
                    ?.label
                }
              </p>
              <p>
                <strong>标签:</strong> {previewData.tags.join(", ")}
              </p>
              <div>
                <strong>内容:</strong>
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
              关闭预览
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
