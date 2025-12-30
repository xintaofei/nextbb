"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { BountyType } from "@/types/topic-type"

interface BountyConfigProps {
  userCredits: number
}

export function BountyConfig({ userCredits }: BountyConfigProps) {
  const form = useFormContext()
  const tb = useTranslations("Topic.Bounty")

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

  return (
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
                            form.setValue("singleAmount", calculatedSingle, {
                              shouldValidate: true,
                            })
                          }
                        }
                        // 如果没有总额但有单次金额，用单次金额算总额
                        else if (singleAmountValue && singleAmountValue > 0) {
                          const calculatedTotal = singleAmountValue * value
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
  )
}
