"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonationList } from "@/components/donation/donation-list"

type DonationType = "month" | "year" | "all"

export default function DonationPage() {
  const t = useTranslations("Donation")
  const [activeTab, setActiveTab] = useState<DonationType>("month")

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heart className="size-8 text-pink-500" />
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as DonationType)}
      >
        <TabsList className="grid w-full grid-cols-3 gap-2 h-auto">
          <TabsTrigger value="month" className="flex items-center gap-1">
            <span>{t("monthTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="year" className="flex items-center gap-1">
            <span>{t("yearTab")}</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <span>{t("allTab")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("monthTab")}</h2>
            <p className="text-sm text-muted-foreground">{t("monthDesc")}</p>
          </div>
          <DonationList type="month" />
        </TabsContent>

        <TabsContent value="year" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("yearTab")}</h2>
            <p className="text-sm text-muted-foreground">{t("yearDesc")}</p>
          </div>
          <DonationList type="year" />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("allTab")}</h2>
            <p className="text-sm text-muted-foreground">{t("allDesc")}</p>
          </div>
          <DonationList type="all" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
