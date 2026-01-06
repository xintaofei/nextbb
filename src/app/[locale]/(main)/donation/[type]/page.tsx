"use client"

import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonationList } from "@/components/donation/donation-list"
import { notFound, useParams } from "next/navigation"
import Link from "next/link"

type DonationType = "month" | "year" | "all"

const VALID_TYPES: DonationType[] = ["month", "year", "all"]

export default function DonationPage() {
  const params = useParams<{ type: string }>()
  const t = useTranslations("Donation")
  const type = params.type

  // 验证类型参数
  if (!VALID_TYPES.includes(type as DonationType)) {
    notFound()
  }

  const activeTab = type as DonationType

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heart className="size-8 text-pink-500" />
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs value={activeTab}>
        <TabsList className="grid w-full grid-cols-3 gap-2 h-auto">
          <TabsTrigger
            value="month"
            className="flex items-center gap-1"
            asChild
          >
            <Link href="/donation/month">
              <span>{t("monthTab")}</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="year" className="flex items-center gap-1" asChild>
            <Link href="/donation/year">
              <span>{t("yearTab")}</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1" asChild>
            <Link href="/donation/all">
              <span>{t("allTab")}</span>
            </Link>
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
