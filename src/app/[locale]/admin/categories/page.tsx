"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AdminCategoriesPage() {
  const t = useTranslations("AdminCategories")
  const [data, setData] = useState<unknown>(null)

  return (
    <div className="relative px-6 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {t("description")}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("createButton")}
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-center text-muted-foreground">
            功能开发中 - API已就绪，前端界面待完善
          </p>
        </div>
      </div>
    </div>
  )
}
