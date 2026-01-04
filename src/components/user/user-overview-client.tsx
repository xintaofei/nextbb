"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  MessageSquare,
  ThumbsUp,
  Heart,
  Bookmark,
  Award,
  FileText,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { TopContentSection } from "./top-content-section"
import { SocialInteractionSection } from "./social-interaction-section"
import { motion, Variants } from "motion/react"

type OverviewStatsProps = {
  userId: string
}

type OverviewStatsData = {
  activeStats: {
    joinDays: number
    topicsCount: number
    postsCount: number
  }
  interactionStats: {
    likesGiven: number
    likesReceived: number
    bookmarksCount: number
    bookmarkedCount: number
  }
  honorStats: {
    badgesCount: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// 容器动画配置
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// 卡片动画配置
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

// 标题动画配置
const titleVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function UserOverviewClient({ userId }: OverviewStatsProps) {
  const t = useTranslations("User.profile.overview")
  const { data, error, isLoading } = useSWR<OverviewStatsData>(
    `/api/users/${userId}/overview-stats`,
    fetcher
  )

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            加载失败，请稍后再试
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* 活跃指标 */}
      <motion.div initial="hidden" animate="visible" variants={titleVariants}>
        <h2 className="text-lg font-semibold mb-4">{t("activeStats.title")}</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("activeStats.joinDays")}
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.activeStats.joinDays}</>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoading || !data ? (
                      <>天</>
                    ) : (
                      <>{data.activeStats.joinDays > 0 ? "天" : "今天加入"}</>
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("activeStats.topicsCreated")}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.activeStats.topicsCount}</>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">条</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("activeStats.repliesCount")}
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.activeStats.postsCount}</>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">条</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 互动指标 */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={titleVariants}
      >
        <h2 className="text-lg font-semibold mb-4">
          {t("interactionStats.title")}
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("interactionStats.likesGiven")}
                  </CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.interactionStats.likesGiven}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("interactionStats.likesReceived")}
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.interactionStats.likesReceived}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("interactionStats.bookmarksCount")}
                  </CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.interactionStats.bookmarksCount}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("interactionStats.bookmarkedCount")}
                  </CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.interactionStats.bookmarkedCount}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 荣誉指标 */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={titleVariants}
      >
        <h2 className="text-lg font-semibold mb-4">{t("honorStats.title")}</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <motion.div variants={cardVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("honorStats.badgesCount")}
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading || !data ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <>{data.honorStats.badgesCount}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 热门内容区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <TopContentSection userId={userId} />
      </motion.div>

      {/* 社交互动排行 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SocialInteractionSection userId={userId} />
      </motion.div>
    </div>
  )
}
