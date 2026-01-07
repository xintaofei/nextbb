"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import useSWR from "swr"

type PostCreateTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

type Category = {
  id: string
  name: string
}

export function PostCreateTriggerConfig({
  value,
  onChange,
}: PostCreateTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.postCreate")
  const { data: categories } = useSWR<{ items: Category[] }>("/api/categories")

  const categoryIds = (value.category_ids as number[]) || []
  const minContentLength = (value.min_content_length as number) || undefined

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryIds.map(String)
  )

  useEffect(() => {
    const ids = selectedCategories.map(Number).filter((n) => !isNaN(n))
    if (ids.length > 0) {
      onChange({ ...value, category_ids: ids })
    } else {
      const newValue = { ...value }
      delete newValue.category_ids
      onChange(newValue)
    }
  }, [selectedCategories])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>{t("categories")}</Label>
        <div className="space-y-2">
          {categories?.items?.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label className="cursor-pointer">{category.name}</Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("categoriesHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minContentLength">{t("minContentLength")}</Label>
        <Input
          id="minContentLength"
          type="number"
          value={minContentLength || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            if (val !== undefined) {
              onChange({ ...value, min_content_length: val })
            } else {
              const newValue = { ...value }
              delete newValue.min_content_length
              onChange(newValue)
            }
          }}
          placeholder="100"
        />
        <p className="text-xs text-muted-foreground">
          {t("minContentLengthHint")}
        </p>
      </div>
    </div>
  )
}
