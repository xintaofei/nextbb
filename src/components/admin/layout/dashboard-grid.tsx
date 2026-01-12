"use client"

import { useState } from "react"
import { motion, Variants, stagger } from "framer-motion"
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  Activity,
  Layers,
  Tag,
  Award,
} from "lucide-react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { ChartCard } from "@/components/admin/cards/chat-card"
import { DetailedCard } from "@/components/admin/cards/detailed-card"
import { InfiniteDetailedCard } from "@/components/admin/cards/infinite-detailed-card"
import { MetricCard } from "@/components/admin/stats/metric-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MetricCardSkeleton,
  ChartCardSkeleton,
  DetailedCardSkeleton,
} from "./dashboard-skeletons"
import type {
  DashboardOverview,
  DashboardTrends,
  DashboardTaxonomy,
  DashboardActivity,
} from "@/types/admin"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: stagger(0.1, { startDelay: 0.2 }),
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

function OverviewSection() {
  const t = useTranslations("AdminOverview")
  const { data, error, isLoading } = useSWR<DashboardOverview>(
    "/api/admin/stats/overview",
    fetcher
  )

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error || !data) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label={t("stats.users")}
        value={data.users.toLocaleString()}
        change="+2.5%"
        trend="up"
        icon={<Users className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.topics")}
        value={data.topics.toLocaleString()}
        change="+1.2%"
        trend="up"
        icon={<FileText className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.posts")}
        value={data.posts.toLocaleString()}
        change="+3.8%"
        trend="up"
        icon={<MessageSquare className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.interactions")}
        value={data.interactions.toLocaleString()}
        change="+5.4%"
        trend="up"
        icon={<Heart className="h-6 w-6 text-primary" />}
      />
    </div>
  )
}

function ActivityTaxonomySection() {
  const t = useTranslations("AdminOverview")
  const { data: activity, isLoading: activityLoading } =
    useSWR<DashboardActivity>("/api/admin/stats/activity", fetcher)
  const { data: taxonomy, isLoading: taxonomyLoading } =
    useSWR<DashboardTaxonomy>("/api/admin/stats/taxonomy", fetcher)

  if (activityLoading || taxonomyLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!activity || !taxonomy) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label={t("stats.activeUsers7d")}
        value={activity.activeUsers7d.toLocaleString()}
        change=""
        trend="up"
        icon={<Activity className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.categories")}
        value={taxonomy.categories.length.toString()}
        change=""
        trend="up"
        icon={<Layers className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.tags")}
        value={taxonomy.tags.length.toString()}
        change=""
        trend="up"
        icon={<Tag className="h-6 w-6 text-primary" />}
      />
      <MetricCard
        label={t("stats.badges")}
        value={`${taxonomy.badges.total} / ${taxonomy.badges.awarded}`}
        change=""
        trend="up"
        icon={<Award className="h-6 w-6 text-primary" />}
      />
    </div>
  )
}

const CHART_COLORS = [
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#84cc16", // Lime
]

const TopNSelect = ({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (v: string) => void
}) => {
  const t = useTranslations("AdminOverview.charts.topN")
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-[100px] border-border/40 bg-background/50 text-xs">
        <SelectValue placeholder={`${t("label")} 5`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="5">{t("label")} 5</SelectItem>
        <SelectItem value="10">{t("label")} 10</SelectItem>
        <SelectItem value="20">{t("label")} 20</SelectItem>
        <SelectItem value="all">{t("all")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

function TrendsSection() {
  const t = useTranslations("AdminOverview.charts")
  const [categoryLimit, setCategoryLimit] = useState("5")
  const [tagLimit, setTagLimit] = useState("5")

  const { data, error, isLoading } = useSWR<DashboardTrends>(
    `/api/admin/stats/trends?categoryLimit=${categoryLimit}&tagLimit=${tagLimit}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
    )
  }

  if (error || !data) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("userGrowth.title")}
          description={t("userGrowth.description")}
          data={data.userGrowth}
          dataKey="value"
          height={300}
        />
        <ChartCard
          title={t("contentActivity.title")}
          description={t("contentActivity.description")}
          data={data.contentGrowth}
          lines={[
            {
              dataKey: "value",
              label: t("contentActivity.total"),
              color: "var(--primary)",
            },
            {
              dataKey: "topics",
              label: t("contentActivity.topics"),
              color: "#10b981",
            },
            {
              dataKey: "posts",
              label: t("contentActivity.posts"),
              color: "#3b82f6",
            },
          ]}
          height={300}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("categoryTrends.title")}
          description={t("categoryTrends.description")}
          data={data.categoryTrends}
          headerAction={
            <TopNSelect
              value={categoryLimit}
              onValueChange={setCategoryLimit}
            />
          }
          lines={data.meta.categories.map((cat, idx) => ({
            dataKey: cat,
            label: cat,
            color: CHART_COLORS[idx % CHART_COLORS.length],
          }))}
          height={300}
        />
        <ChartCard
          title={t("tagTrends.title")}
          description={t("tagTrends.description")}
          data={data.tagTrends}
          headerAction={
            <TopNSelect value={tagLimit} onValueChange={setTagLimit} />
          }
          lines={data.meta.tags.map((tag, idx) => ({
            dataKey: tag,
            label: tag,
            color: CHART_COLORS[idx % CHART_COLORS.length],
          }))}
          height={300}
        />
      </div>
    </div>
  )
}

function DetailedSection() {
  const t = useTranslations("AdminOverview")
  const { data: activity, isLoading: activityLoading } =
    useSWR<DashboardActivity>("/api/admin/stats/activity", fetcher)

  if (activityLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <DetailedCardSkeleton />
        <DetailedCardSkeleton />
        <DetailedCardSkeleton />
      </div>
    )
  }

  if (!activity) return null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <DetailedCard
        title={t("stats.activeUsers7d")}
        items={activity.topActiveUsers.map((user) => ({
          label: user.name,
          value: user.postCount.toString(),
          subtitle: t("charts.contentActivity.posts"),
        }))}
      />
      <InfiniteDetailedCard
        title={t("logs.badges.title")}
        apiUrl="/api/admin/stats/logs/badges"
      />
      <InfiniteDetailedCard
        title={t("logs.registrations.title")}
        apiUrl="/api/admin/stats/logs/users"
      />
    </div>
  )
}

export function DashboardGrid() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <OverviewSection />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ActivityTaxonomySection />
      </motion.div>

      <motion.div variants={itemVariants}>
        <TrendsSection />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DetailedSection />
      </motion.div>
    </motion.div>
  )
}
