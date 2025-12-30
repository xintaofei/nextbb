"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { formatRelative } from "@/lib/time"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

type QuestionAcceptanceData = {
  hasAcceptance: boolean
  postId?: string
  acceptedBy?: {
    id: string
    name: string
    avatar: string
  }
  acceptedAt?: string
}

type QuestionAcceptanceDisplayProps = {
  topicId: string
  topicIsSettled?: boolean
}

export function QuestionAcceptanceDisplay({
  topicId,
  topicIsSettled = false,
}: QuestionAcceptanceDisplayProps) {
  const t = useTranslations("Topic.Question")

  const fetcher = async (url: string): Promise<QuestionAcceptanceData> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load acceptance info")
    return await res.json()
  }

  const { data, isLoading, error } = useSWR<QuestionAcceptanceData>(
    `/api/topic/${topicId}/acceptance`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  const hasAcceptance = data.hasAcceptance && data.acceptedBy && data.acceptedAt

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-900/50 bg-linear-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <CheckCircle2 className="h-5 w-5" />
          {t("acceptance.title")}
          {(topicIsSettled || hasAcceptance) && (
            <Badge
              variant="secondary"
              className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              {t("acceptance.status.settled")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAcceptance && data.acceptedBy && data.acceptedAt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/30 border border-blue-100 dark:border-blue-900/30">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={data.acceptedBy!.avatar}
                  alt={data.acceptedBy!.name}
                />
                <AvatarFallback>
                  {data.acceptedBy!.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {t("acceptance.info.acceptedBy")}
                  </span>
                  <span className="font-medium">{data.acceptedBy!.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("acceptance.info.acceptedAt")}:{" "}
                  {formatRelative(data.acceptedAt!)}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t("acceptance.status.settled")}
              </Badge>
            </div>
          </div>
        ) : (
          <Alert className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              {t("acceptance.status.noAnswer")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
