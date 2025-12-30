"use client"

import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { X } from "lucide-react"

export function PollConfig() {
  const form = useFormContext()
  const tf = useTranslations("Topic.Form")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])

  const allowMultipleValue = useWatch({
    control: form.control,
    name: "pollConfig.allowMultiple",
  })

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

  return (
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
  )
}
