"use client"

import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { DrawType, AlgorithmType } from "@/types/topic-type"

export function LotteryConfig() {
  const form = useFormContext()
  const tf = useTranslations("Topic.Lottery")

  // 用于指定楼层输入的临时状态
  const [floorInput, setFloorInput] = useState("")

  // 监听开奖类型和算法类型的变化
  const drawType = useWatch({ control: form.control, name: "drawType" })
  const algorithmType = useWatch({
    control: form.control,
    name: "algorithmType",
  })

  return (
    <div className="space-y-4">
      {/* 开奖类型选择 */}
      <FormField
        control={form.control}
        name="drawType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tf("drawType.label")}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={DrawType.SCHEDULED} id="scheduled" />
                  <Label htmlFor="scheduled">{tf("drawType.scheduled")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={DrawType.THRESHOLD} id="threshold" />
                  <Label htmlFor="threshold">{tf("drawType.threshold")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={DrawType.INSTANT} id="instant" />
                  <Label htmlFor="instant">{tf("drawType.instant")}</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 定时开奖：显示时间选择器 */}
      {drawType === DrawType.SCHEDULED && (
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
              <FormDescription>{tf("endTime.info")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 满人开奖：显示参与阈值 */}
      {drawType === DrawType.THRESHOLD && (
        <FormField
          control={form.control}
          name="participantThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tf("participantThreshold.label")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={tf("participantThreshold.placeholder")}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                {tf("participantThreshold.info")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 抽奖算法选择 */}
      <FormField
        control={form.control}
        name="algorithmType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tf("algorithmType.label")}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={AlgorithmType.INTERVAL}
                    id="interval"
                  />
                  <Label htmlFor="interval">
                    {tf("algorithmType.interval")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AlgorithmType.RANDOM} id="random" />
                  <Label htmlFor="random">{tf("algorithmType.random")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={AlgorithmType.FIXED} id="fixed" />
                  <Label htmlFor="fixed">{tf("algorithmType.fixed")}</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 间隔楼层：显示楼层间隔 */}
      {algorithmType === AlgorithmType.INTERVAL && (
        <FormField
          control={form.control}
          name="floorInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tf("floorInterval.label")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={tf("floorInterval.placeholder")}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>{tf("floorInterval.info")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 随机楼层：显示中奖人数 */}
      {algorithmType === AlgorithmType.RANDOM && (
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
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>{tf("winnerCount.info")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 指定楼层：显示楼层列表 */}
      {algorithmType === AlgorithmType.FIXED && (
        <FormField
          control={form.control}
          name="fixedFloors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tf("fixedFloors.label")}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder={tf("fixedFloors.placeholder")}
                  value={floorInput}
                  onChange={(e) => {
                    setFloorInput(e.target.value)
                  }}
                  onBlur={(e) => {
                    const input = e.target.value
                    if (!input) {
                      field.onChange([])
                      setFloorInput("")
                      return
                    }
                    // 解析逗号分隔的楼层号（支持中英文逗号）
                    const floors = input
                      .split(/[,，]/)
                      .map((f) => {
                        const num = parseInt(f.trim(), 10)
                        return isNaN(num) ? null : num
                      })
                      .filter((f) => f !== null) as number[]
                    field.onChange(floors)
                    // 更新显示值为格式化后的楼层列表
                    setFloorInput(floors.join(", "))
                  }}
                  onFocus={() => {
                    // 获取焦点时，如果floorInput为空且field有值，将field值显示到输入框
                    if (
                      !floorInput &&
                      field.value &&
                      Array.isArray(field.value)
                    ) {
                      setFloorInput(field.value.join(", "))
                    }
                  }}
                />
              </FormControl>
              <FormDescription>{tf("fixedFloors.info")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 参与门槛 */}
      <FormField
        control={form.control}
        name="entryCost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tf("entryCost.label")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={tf("entryCost.placeholder")}
                {...field}
                value={field.value ?? 0}
                onChange={(e) =>
                  field.onChange(e.target.value ? Number(e.target.value) : 0)
                }
              />
            </FormControl>
            <FormDescription>{tf("entryCost.info")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
