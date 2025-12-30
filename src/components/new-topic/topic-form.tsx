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
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/components/filters/category-select"
import { TagsMultiSelect } from "./tags-multi-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Checkbox } from "@/components/ui/checkbox"
import { TopicType, BountyType, type TopicTypeValue } from "@/types/topic-type"
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
  X,
} from "lucide-react"

type MeResponse = {
  user: {
    id: string
    email?: string | null
    isAdmin?: boolean
    credits?: number
  }
  profile?: {
    id: string
    email: string
    username: string
    avatar?: string | null
  } | null
} | null

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
  const tf = useTranslations("Topic.Form")
  const tb = useTranslations("Topic.Bounty")

  const [selectedType, setSelectedType] = useState<TopicTypeValue>(
    TopicType.GENERAL
  )
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])

  const fetcher = async (url: string): Promise<MeResponse> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as MeResponse
  }
  const { data: me } = useSWR<MeResponse>("/api/auth/me", fetcher)
  const isAdmin = me?.user?.isAdmin === true
  const userCredits = me?.user?.credits ?? 0

  const topicFormSchema = createTopicFormSchemaWithCredits(userCredits)

  type FormValues = z.infer<typeof topicFormSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      type: TopicType.GENERAL,
      title: "",
      categoryId: "",
      content: "",
      tags: [],
      isPinned: false,
      isCommunity: false,
    } as FormValues,
  })

  const titleValue = useWatch({ control: form.control, name: "title" })
  const contentValue = useWatch({ control: form.control, name: "content" })
  const bountyTypeValue = useWatch({
    control: form.control,
    name: "bountyType",
  })
  const bountyTotalValue = useWatch({
    control: form.control,
    name: "bountyTotal",
  })
  const bountySlotsValue = useWatch({
    control: form.control,
    name: "bountySlots",
  })
  const singleAmountValue = useWatch({
    control: form.control,
    name: "singleAmount",
  })
  const allowMultipleValue = useWatch({
    control: form.control,
    name: "pollConfig.allowMultiple",
  })
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

    // 重置表单为新类型
    form.reset(baseValues, { keepErrors: false })

    // 重置投票选项状态
    if (typeValue !== TopicType.POLL) {
      setPollOptions(["", ""])
    }
  }

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index)
      setPollOptions(newOptions)
      form.setValue(
        "pollOptions",
        newOptions.map((text) => ({ text }))
      )
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
    form.setValue(
      "pollOptions",
      newOptions.map((text) => ({ text }))
    )
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
        className="space-y-6"
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
                  className="min-h-50 resize-y"
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

        {/* 类型特定字段 */}
        {selectedType === TopicType.BOUNTY && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              {tb("form.currentCredits")}: {userCredits}
            </div>

            <FormField
              control={form.control}
              name="bountyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tb("form.bountyType")}</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value || BountyType.SINGLE}
                      onValueChange={(v) => {
                        field.onChange(v)
                        // 切换到单人模式时重置相关字段
                        if (v === BountyType.SINGLE) {
                          form.setValue("bountySlots", 1)
                          form.setValue("singleAmount", undefined)
                        } else {
                          // 切换到多人模式时设置默认值
                          if (
                            !form.getValues("bountySlots") ||
                            form.getValues("bountySlots") === 1
                          ) {
                            form.setValue("bountySlots", 2)
                          }
                        }
                      }}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value={BountyType.SINGLE}>
                          {tb("single")}
                        </TabsTrigger>
                        <TabsTrigger value={BountyType.MULTIPLE}>
                          {tb("multiple")}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bountyTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tb("form.totalAmount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number(e.target.value)
                          : undefined
                        field.onChange(value)

                        // 多人模式：如果有名额和单次金额，自动计算总额（但不触发此逻辑）
                        // 这里用户直接输入总额，需要反算单次金额
                        if (
                          bountyTypeValue === BountyType.MULTIPLE &&
                          value &&
                          bountySlotsValue &&
                          bountySlotsValue > 0
                        ) {
                          const calculatedSingle = Math.floor(
                            value / bountySlotsValue
                          )
                          if (calculatedSingle > 0) {
                            form.setValue("singleAmount", calculatedSingle, {
                              shouldValidate: true,
                            })
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {bountyTypeValue === BountyType.MULTIPLE && (
              <>
                <FormField
                  control={form.control}
                  name="bountySlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tb("form.slots")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : undefined
                            field.onChange(value)

                            // 多人模式：名额变化时自动重新计算
                            if (value && value > 0) {
                              // 优先使用总额反算单次金额
                              if (bountyTotalValue && bountyTotalValue > 0) {
                                const calculatedSingle = Math.floor(
                                  bountyTotalValue / value
                                )
                                if (calculatedSingle > 0) {
                                  form.setValue(
                                    "singleAmount",
                                    calculatedSingle,
                                    { shouldValidate: true }
                                  )
                                }
                              }
                              // 如果没有总额但有单次金额，用单次金额算总额
                              else if (
                                singleAmountValue &&
                                singleAmountValue > 0
                              ) {
                                const calculatedTotal =
                                  singleAmountValue * value
                                form.setValue("bountyTotal", calculatedTotal, {
                                  shouldValidate: true,
                                })
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="singleAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tb("form.singleAmount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : undefined
                            field.onChange(value)

                            // 多人模式：单次金额变化时，如果有名额，自动计算总额
                            if (
                              value &&
                              value > 0 &&
                              bountySlotsValue &&
                              bountySlotsValue > 0
                            ) {
                              const calculatedTotal = value * bountySlotsValue
                              form.setValue("bountyTotal", calculatedTotal, {
                                shouldValidate: true,
                              })
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>{tb("form.totalHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        )}

        {selectedType === TopicType.POLL && (
          <div className="space-y-4">
            <FormLabel>{tf("pollOptions.label")}</FormLabel>
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={tf("pollOptions.placeholder", {
                    index: index + 1,
                  })}
                  value={option}
                  onChange={(e) => updatePollOption(index, e.target.value)}
                  className="flex-1"
                />
                {pollOptions.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removePollOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {pollOptions.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addPollOption}
                className="w-full"
              >
                {tf("pollOptions.addOption")}
              </Button>
            )}

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("endTime.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>{tf("pollConfig.label")}</FormLabel>

              <FormField
                control={form.control}
                name="pollConfig.allowMultiple"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(v) => {
                          field.onChange(Boolean(v))
                          // 取消多选时清空maxChoices
                          if (!v) {
                            form.setValue("pollConfig.maxChoices", null)
                          }
                        }}
                        aria-label={tf("pollConfig.allowMultiple")}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      {tf("pollConfig.allowMultiple")}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {allowMultipleValue && (
                <FormField
                  control={form.control}
                  name="pollConfig.maxChoices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf("pollConfig.maxChoices")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={tf("pollConfig.maxChoicesPlaceholder")}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="pollConfig.showResultsBeforeVote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        aria-label={tf("pollConfig.showResultsBeforeVote")}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      {tf("pollConfig.showResultsBeforeVote")}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pollConfig.showVoterList"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        aria-label={tf("pollConfig.showVoterList")}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      {tf("pollConfig.showVoterList")}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormMessage />
          </div>
        )}

        {selectedType === TopicType.LOTTERY && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="lotteryEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("lotteryEndTime.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lotteryRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("lotteryRules.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tf("lotteryRules.placeholder")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="winnerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("winnerCount.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={tf("winnerCount.placeholder")}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minCredits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf("minCredits.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={tf("minCredits.placeholder")}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>{tf("minCredits.info")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 管理员选项 */}
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
