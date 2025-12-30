"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PollVoter = {
  id: string
  name: string
  avatar: string
}

type PollOptionData = {
  id: string
  text: string
  voteCount: number
  percentage: number
  rank: number
  userVoted: boolean
  voters: PollVoter[] | null
}

type PollConfigData = {
  allowMultiple: boolean
  maxChoices: number | null
  showResultsBeforeVote: boolean
  showVoterList: boolean
  totalVotes: number
  totalVoteCount: number
}

type PollData = {
  config: PollConfigData
  options: PollOptionData[]
  userVotedOptionIds: string[]
  canVote: boolean
  hasVoted: boolean
}

type PollDisplayProps = {
  topicId: string
  topicStatus: string
  endTime: string | null
}

function calculateTimeRemaining(endTime: string | null) {
  if (!endTime) return null

  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diff = end - now

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, total: diff }
}

export function PollDisplay({
  topicId,
  topicStatus,
  endTime,
}: PollDisplayProps) {
  const t = useTranslations("Topic.Poll")
  const tc = useTranslations("Common")
  const ts = useTranslations("Topic.Status")

  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(endTime)
  )

  // 获取投票数据
  const { data, mutate, isLoading } = useSWR<PollData>(
    `/api/topic/${topicId}/poll`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch poll data")
      return res.json()
    }
  )

  // 投票 mutation
  const { trigger: triggerVote, isMutating: isVoting } = useSWRMutation(
    `/api/topic/${topicId}/vote`,
    async (url, { arg }: { arg: { optionIds: string[] } }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to vote")
      }
      return res.json()
    }
  )

  // 取消投票 mutation
  const { trigger: triggerCancelVote, isMutating: isCanceling } =
    useSWRMutation(`/api/topic/${topicId}/vote`, async (url: string) => {
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel vote")
      }
      return res.json()
    })

  // 倒计时更新
  useEffect(() => {
    if (!endTime) return

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime)
      setTimeRemaining(remaining)

      if (!remaining) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  // 初始化选中的选项
  useEffect(() => {
    if (data?.userVotedOptionIds && selectedOptions.length === 0) {
      setSelectedOptions(data.userVotedOptionIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.userVotedOptionIds])

  if (isLoading || !data) {
    return (
      <div className="w-full p-6 border rounded-lg bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { config, options, canVote, hasVoted } = data
  const isClosed = topicStatus === "CLOSED" || !timeRemaining

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast.error(t("selectOption"))
      return
    }

    try {
      await triggerVote({ optionIds: selectedOptions })
      await mutate()
      toast.success(t("voteSuccess"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc("Error.requestFailed")
      )
    }
  }

  const handleCancelVote = async () => {
    try {
      await triggerCancelVote()
      setSelectedOptions([])
      await mutate()
      toast.success(t("voteCanceled"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc("Error.requestFailed")
      )
    }
  }

  const handleOptionChange = (optionId: string) => {
    if (isClosed || !canVote) return

    if (config.allowMultiple) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId)
        }
        if (config.maxChoices && prev.length >= config.maxChoices) {
          toast.error(t("multipleChoice", { max: config.maxChoices }))
          return prev
        }
        return [...prev, optionId]
      })
    } else {
      setSelectedOptions([optionId])
    }
  }

  const getTimeRemainingColor = () => {
    if (!timeRemaining) return "text-muted-foreground"
    const totalMs = timeRemaining.total
    const threeDays = 3 * 24 * 60 * 60 * 1000
    const oneDay = 24 * 60 * 60 * 1000

    if (totalMs > threeDays) return "text-green-600 dark:text-green-400"
    if (totalMs > oneDay) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="w-full border rounded-lg bg-card">
      {/* 状态栏 */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {config.allowMultiple
                ? t("multipleChoice", { max: config.maxChoices || "∞" })
                : t("singleChoice")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {t("totalVotes", { count: config.totalVotes })}
            </span>
          </div>

          {isClosed ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {t("voteClosed")}
            </Badge>
          ) : timeRemaining ? (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                getTimeRemainingColor()
              )}
            >
              <Clock className="h-3 w-3" />
              <span>
                {t("timeRemaining")}{" "}
                {timeRemaining.days > 0 && `${timeRemaining.days}${t("days")}`}{" "}
                {timeRemaining.hours}
                {t("hours")} {timeRemaining.minutes}
                {t("minutes")}
              </span>
            </div>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {ts("active")}
            </Badge>
          )}
        </div>
      </div>

      {/* 选项列表 */}
      <div className="p-4 space-y-3">
        {config.allowMultiple ? (
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.id)
              const showResults =
                isClosed || hasVoted || config.showResultsBeforeVote

              return (
                <div
                  key={option.id}
                  className={cn(
                    "relative p-4 border rounded-lg transition-all",
                    isSelected &&
                      option.userVoted &&
                      "border-primary bg-primary/5",
                    !isClosed &&
                      canVote &&
                      "cursor-pointer hover:border-primary/50"
                  )}
                  onClick={() => handleOptionChange(option.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`poll-option-${option.id}`}
                      checked={isSelected}
                      disabled={isClosed || !canVote}
                      className="mt-1 pointer-events-none"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`poll-option-${option.id}`}
                          className="text-base font-medium flex items-center gap-2 cursor-pointer"
                        >
                          {option.text}
                          {option.userVoted && (
                            <Badge variant="default" className="text-xs">
                              {t("myChoice")}
                            </Badge>
                          )}
                        </Label>
                        {showResults && (
                          <span className="text-sm font-semibold">
                            {option.percentage}%
                          </span>
                        )}
                      </div>

                      {showResults && (
                        <>
                          <Progress value={option.percentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {option.voteCount} {t("votes")}
                            </span>
                            <span>{t("rank", { rank: option.rank })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <RadioGroup
            value={selectedOptions[0]}
            onValueChange={handleOptionChange}
          >
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.id)
              const showResults =
                isClosed || hasVoted || config.showResultsBeforeVote

              return (
                <div
                  key={option.id}
                  className={cn(
                    "relative p-4 border rounded-lg transition-all",
                    isSelected &&
                      option.userVoted &&
                      "border-primary bg-primary/5",
                    !isClosed &&
                      canVote &&
                      "cursor-pointer hover:border-primary/50"
                  )}
                  onClick={() => {
                    if (!isClosed && canVote) {
                      handleOptionChange(option.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id={`poll-option-${option.id}`}
                      value={option.id}
                      disabled={isClosed || !canVote}
                      className="mt-1 pointer-events-none"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`poll-option-${option.id}`}
                          className="text-base font-medium flex items-center gap-2 cursor-pointer"
                        >
                          {option.text}
                          {option.userVoted && (
                            <Badge variant="default" className="text-xs">
                              {t("myChoice")}
                            </Badge>
                          )}
                        </Label>
                        {showResults && (
                          <span className="text-sm font-semibold">
                            {option.percentage}%
                          </span>
                        )}
                      </div>

                      {showResults && (
                        <>
                          <Progress value={option.percentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {option.voteCount} {t("votes")}
                            </span>
                            <span>{t("rank", { rank: option.rank })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        )}
      </div>

      {/* 操作按钮 */}
      {canVote && !isClosed && (
        <div className="p-4 border-t bg-muted/30 flex gap-2">
          {hasVoted ? (
            <>
              <Button
                onClick={handleVote}
                disabled={
                  isVoting ||
                  selectedOptions.length === 0 ||
                  JSON.stringify(selectedOptions.sort()) ===
                    JSON.stringify(data.userVotedOptionIds.sort())
                }
                className="flex-1"
              >
                {isVoting ? tc("Loading.loading") : t("changeVote")}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelVote}
                disabled={isCanceling}
              >
                {isCanceling ? tc("Loading.loading") : t("cancelVote")}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleVote}
              disabled={isVoting || selectedOptions.length === 0}
              className="flex-1"
            >
              {isVoting ? tc("Loading.loading") : t("vote")}
            </Button>
          )}
        </div>
      )}

      {isClosed && (
        <div className="p-4 border-t bg-destructive/10">
          <p className="text-sm text-center text-muted-foreground">
            {t("voteClosed")}
          </p>
        </div>
      )}
    </div>
  )
}
