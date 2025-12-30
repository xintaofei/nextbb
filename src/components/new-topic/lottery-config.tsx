"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function LotteryConfig() {
  const form = useFormContext()
  const tf = useTranslations("Topic.Form")

  return (
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
                  field.onChange(e.target.value ? Number(e.target.value) : null)
                }
              />
            </FormControl>
            <FormDescription>{tf("minCredits.info")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
