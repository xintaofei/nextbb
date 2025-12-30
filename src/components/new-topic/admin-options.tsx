"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function AdminOptions() {
  const form = useFormContext()
  const t = useTranslations("Topic.New")

  return (
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
            <FormLabel className="m-0">{t("form.isPinned.label")}</FormLabel>
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
            <FormLabel className="m-0">{t("form.isCommunity.label")}</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
