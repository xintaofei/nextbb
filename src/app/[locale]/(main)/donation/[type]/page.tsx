"use client"

import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonationList } from "@/components/donation/donation-list"
import { notFound, useParams } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { NeonGradientCard } from "@/components/ui/neon-gradient-card"

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

  const showConfetti = () => {
    const end = Date.now() + 3 * 1000
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
    const frame = () => {
      if (Date.now() > end) return
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })
      requestAnimationFrame(frame)
    }
    frame()
  }

  useEffect(() => {
    showConfetti()
  }, [])

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="size-8 text-pink-500" />
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
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
          <NeonGradientCard className="w-full h-auto mb-6 items-center justify-center text-center">
            <span className="pointer-events-none z-10 h-full bg-linear-to-br from-[#ff2975] from-35% to-[#00FFF1] bg-clip-text text-center text-3xl leading-none font-bold tracking-tighter text-balance whitespace-pre-wrap text-transparent md:text-5xl xl:text-6xl dark:drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {t("subtitle")}
            </span>
          </NeonGradientCard>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("monthTab")}</h2>
            <p className="text-sm text-muted-foreground">{t("monthDesc")}</p>
          </div>
          <DonationList type="month" />
        </TabsContent>

        <TabsContent value="year" className="mt-6">
          <NeonGradientCard className="w-full h-auto mb-6 items-center justify-center text-center">
            <span className="pointer-events-none z-10 h-full bg-linear-to-br from-[#ff2975] from-35% to-[#00FFF1] bg-clip-text text-center text-3xl leading-none font-bold tracking-tighter text-balance whitespace-pre-wrap text-transparent md:text-5xl xl:text-6xl dark:drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {t("subtitle")}
            </span>
          </NeonGradientCard>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("yearTab")}</h2>
            <p className="text-sm text-muted-foreground">{t("yearDesc")}</p>
          </div>
          <DonationList type="year" />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <NeonGradientCard className="w-full h-auto mb-6 items-center justify-center text-center">
            <span className="pointer-events-none z-10 h-full bg-linear-to-br from-[#ff2975] from-35% to-[#00FFF1] bg-clip-text text-center text-3xl leading-none font-bold tracking-tighter text-balance whitespace-pre-wrap text-transparent md:text-5xl xl:text-6xl dark:drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {t("subtitle")}
            </span>
          </NeonGradientCard>
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
