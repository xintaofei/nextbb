"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
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
import { CategorySelect } from "@/components/filters/category-select"
import { TagsMultiSelect } from "@/components/filters/tags-multi-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import { TopicType, type TopicTypeValue } from "@/types/topic-type"
import {
  createTopicFormSchemaWithCredits,
  type TopicFormData,
} from "@/lib/topic-validation"
import {
  MessageSquare,
  HelpCircle,
  Trophy,
  BarChart3,
  Gift,
  BookOpen,
} from "lucide-react"
import { BountyConfig } from "./bounty-config"
import { PollConfig } from "./poll-config"
import { LotteryConfig } from "./lottery-config"
import { AdminOptions } from "./admin-options"
import { MilkdownEditorWrapper } from "@/components/editor/content-editor"
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile"

interface TopicFormProps {
  onSubmit: (data: TopicFormData) => void
  isSubmitting?: boolean
  onCancel?: () => void
}
export function TopicForm({
  onSubmit,
  isSubmitting = false,
  onCancel,
}: TopicFormProps) {
  const t = useTranslations("Topic.New")
  const tt = useTranslations("Topic.Type")
  const tv = useTranslations() // 用于验证消息

  const [selectedType, setSelectedType] = useState<TopicTypeValue>(
    TopicType.GENERAL
  )
  const [isSyncing, setIsSyncing] = useState(false)

  const { userProfile } = useCurrentUserProfile()
  const isAdmin = userProfile?.isAdmin === true
  // 使用实时的用户积分，而不是从 auth session 中获取
  const userCredits = userProfile?.credits ?? 0

  const topicFormSchema = createTopicFormSchemaWithCredits(
    userCredits,
    (key: string) => tv(key)
  )

  type FormValues = z.infer<typeof topicFormSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      type: TopicType.GENERAL,
      title: "",
      categoryId: "",
      content: "",
      content_html: "",
      tags: [],
      isPinned: false,
      isCommunity: false,
    } as FormValues,
  })

  const titleValue = useWatch({ control: form.control, name: "title" })
  const contentValue = useWatch({ control: form.control, name: "content" })
  const titleCount = titleValue?.length || 0
  const contentCount = contentValue?.length || 0

  const handleTypeChange = (type: string) => {
    const typeValue = type as TopicTypeValue
    setSelectedType(typeValue)

    // 获取当前表单值
    const currentValues = form.getValues()

    // 根据类型重置表单，保留基础字段
    let baseValues: FormValues = {
      type: typeValue,
      title: currentValues.title || "",
      categoryId: currentValues.categoryId || "",
      content: currentValues.content || "",
      content_html: currentValues.content_html || "",
      tags: currentValues.tags || [],
      isPinned: currentValues.isPinned || false,
      isCommunity: currentValues.isCommunity || false,
    } as FormValues

    // 如果是 POLL 类型，添加默认 pollConfig
    if (typeValue === TopicType.POLL) {
      baseValues = {
        ...baseValues,
        pollConfig: {
          allowMultiple: false,
          maxChoices: null,
          showResultsBeforeVote: false,
          showVoterList: false,
        },
      } as FormValues
    }

    // 如果是 BOUNTY 类型，添加默认 bountyType 和 bountySlots
    if (typeValue === TopicType.BOUNTY) {
      baseValues = {
        ...baseValues,
        bountyType: "SINGLE",
        bountySlots: 1,
      } as FormValues
    }

    // 如果是 LOTTERY 类型，添加默认 entryCost
    if (typeValue === TopicType.LOTTERY) {
      baseValues = {
        ...baseValues,
        entryCost: 0,
      } as FormValues
    }

    // 重置表单为新类型
    form.reset(baseValues, { keepErrors: false })
  }

  const getTypeIcon = (type: TopicTypeValue) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case TopicType.GENERAL:
        return <MessageSquare className={iconClass} />
      case TopicType.QUESTION:
        return <HelpCircle className={iconClass} />
      case TopicType.BOUNTY:
        return <Trophy className={iconClass} />
      case TopicType.POLL:
        return <BarChart3 className={iconClass} />
      case TopicType.LOTTERY:
        return <Gift className={iconClass} />
      case TopicType.TUTORIAL:
        return <BookOpen className={iconClass} />
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          onSubmit(data)
        })}
        className="space-y-4"
      >
        {/* 类型选择 Tabs */}
        <Tabs value={selectedType} onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-3 gap-2 h-auto">
            <TabsTrigger
              value={TopicType.GENERAL}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.GENERAL)}
              <span>{tt("general")}</span>
            </TabsTrigger>
            <TabsTrigger
              value={TopicType.QUESTION}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.QUESTION)}
              <span>{tt("question")}</span>
            </TabsTrigger>
            <TabsTrigger
              value={TopicType.BOUNTY}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.BOUNTY)}
              <span>{tt("bounty")}</span>
            </TabsTrigger>
            <TabsTrigger
              value={TopicType.POLL}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.POLL)}
              <span>{tt("poll")}</span>
            </TabsTrigger>
            <TabsTrigger
              value={TopicType.LOTTERY}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.LOTTERY)}
              <span>{tt("lottery")}</span>
            </TabsTrigger>
            <TabsTrigger
              value={TopicType.TUTORIAL}
              className="gap-1 text-xs sm:text-sm"
            >
              {getTypeIcon(TopicType.TUTORIAL)}
              <span>{tt("tutorial")}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-2 text-sm text-muted-foreground">
            {tt(`description.${selectedType.toLowerCase()}`)}
          </div>
        </Tabs>

        {/* 隐藏的 type 字段 */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        {/* 基础字段 */}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.category.label")}</FormLabel>
                <FormControl>
                  <CategorySelect
                    className="min-w-36"
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
                    className="min-w-36"
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
                <MilkdownEditorWrapper
                  value={field.value}
                  placeholder={t("form.content.placeholder")}
                  slashPlaceholder={tv("Editor.SlashCommand.slashPlaceholder")}
                  onChange={(val, _json, html) => {
                    field.onChange(val)
                    if (html) {
                      form.setValue("content_html", html)
                    }
                  }}
                  onPendingChange={setIsSyncing}
                />
              </FormControl>
              <FormDescription>
                {t("form.content.counter", { count: contentCount })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 类型特定字段 */}
        {selectedType === TopicType.BOUNTY && (
          <BountyConfig userCredits={userCredits} />
        )}

        {selectedType === TopicType.POLL && <PollConfig />}

        {selectedType === TopicType.LOTTERY && <LotteryConfig />}

        {/* 管理员选项 */}
        {isAdmin && <AdminOptions />}

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
          <Button type="submit" disabled={isSubmitting || isSyncing}>
            {isSubmitting
              ? t("form.actions.publishing")
              : t("form.actions.publish")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
