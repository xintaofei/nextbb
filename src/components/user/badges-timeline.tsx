"use client"

import { motion, useInView } from "motion/react"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, UserIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BadgeItem } from "@/types/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Highlighter } from "@/components/ui/highlighter"

type BadgesTimelineProps = {
  badges: BadgeItem[]
}

function BadgesTimeline({ badges }: BadgesTimelineProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: "徽章列表",
      description: "用户获得的所有徽章及获得时间线",
      awardedAt: "授予时间",
      awardedBy: "授予人",
      system: "系统",
      empty: "暂未获得任何徽章",
      emptyDescription: "参与社区活动获取徽章吧！",
    }
    return translations[key] || key
  }

  return (
    <section ref={ref} className="w-full bg-background px-4 py-16 max-sm:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <Badge className="mb-4" variant="secondary">
            <Calendar className="mr-1 h-3 w-3" />
            徽章旅程
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <motion.div
            className="absolute left-4 top-0 h-full w-0.5 bg-linear-to-b from-primary via-primary/50 to-primary/20 md:left-1/2 md:-translate-x-1/2"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
          />

          <div className="space-y-12 md:space-y-16">
            {badges.map((badge, index) => {
              const isEven = index % 2 === 0
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                  }
                  transition={{
                    delay: index * 0.2,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className={`relative flex items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline node */}
                  <div className="absolute left-4 flex h-8 w-8 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                    <motion.div
                      className="flex h-8 w-8 items-center justify-center rounded-full border-4 z-10"
                      style={{
                        backgroundColor: badge.bgColor || undefined,
                        color: badge.textColor || undefined,
                        borderColor: badge.bgColor
                          ? `${badge.bgColor}80`
                          : undefined,
                      }}
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : { scale: 0 }}
                      transition={{
                        delay: index * 0.2 + 0.3,
                        type: "spring",
                      }}
                    >
                      <span className="flex items-center justify-center size-4">
                        {badge.icon}
                      </span>
                    </motion.div>
                    <motion.div
                      className="absolute h-8 w-8 rounded-full"
                      style={{
                        backgroundColor: badge.bgColor || undefined,
                      }}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    />
                  </div>

                  {/* Content card */}
                  <div
                    className={`ml-16 w-full md:ml-0 md:w-5/12 ${
                      isEven ? "md:pr-12" : "md:pl-12"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="relative overflow-hidden border-border/50 bg-card p-4 shadow-none md:p-6">
                        <motion.div
                          className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          whileHover={{ opacity: 1 }}
                        />

                        <div>
                          <h3 className="mb-2 text-lg font-bold md:text-xl rounded-lg">
                            {" "}
                            <Highlighter
                              action="highlight"
                              color={badge.bgColor || undefined}
                            >
                              <span
                                style={{ color: badge.textColor || undefined }}
                              >
                                {badge.name}
                              </span>
                            </Highlighter>{" "}
                            -{" "}
                            <Highlighter
                              action="underline"
                              color={badge.textColor || undefined}
                            >
                              Level {badge.level}
                            </Highlighter>{" "}
                          </h3>
                          <p className="text-sm text-muted-foreground md:text-base">
                            {badge.description}
                          </p>
                        </div>

                        {/* 授予信息 */}
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          {/* 授予时间 */}
                          {badge.awardedAt && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="h-4 w-4" />
                              <span>{t("awardedAt")}: </span>
                              <span>
                                {new Date(badge.awardedAt).toLocaleString(
                                  "zh-CN",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          )}

                          {/* 授予人 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <UserIcon className="h-4 w-4" />
                            <span>{t("awardedBy")}: </span>
                            {badge.awardedBy && badge.awarderName ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={badge.awarderAvatar || ""}
                                    alt={badge.awarderName}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {badge.awarderName
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {badge.awarderName}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium">{t("system")}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden w-5/12 md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Future indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: badges.length * 0.2 + 0.5 }}
          className="mt-12 text-center md:mt-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            <span className="text-sm font-medium">
              共获得{badges.length}个徽章
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default BadgesTimeline
