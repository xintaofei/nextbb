"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChevronsUp,
  ChevronsDown,
  ArrowDown10,
  LogIn,
  Reply,
} from "lucide-react"

type TopicNavigatorProps = {
  total: number
  isAuthenticated?: boolean
  onReplyTopic?: () => void
  topicLoading?: boolean
  repliesLoading?: boolean
}

export function TopicNavigator({
  total,
  isAuthenticated,
  onReplyTopic,
  topicLoading,
  repliesLoading,
}: TopicNavigatorProps) {
  const t = useTranslations("Topic.Navigator")
  const router = useRouter()
  const totalFloors = Math.max(total - 1, 0)
  const [current, setCurrent] = useState(1)
  const currentRef = useRef(1)
  const [sliderValue, setSliderValue] = useState<number[]>([
    Math.max(totalFloors, 1),
  ])
  const anchorsRef = useRef<HTMLElement[]>([])
  const rafRef = useRef<number | null>(null)
  const [author, setAuthor] = useState("")
  const authorRef = useRef<string>("")
  const sliderWrapRef = useRef<HTMLDivElement | null>(null)
  const labelRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const sliderTargetRef = useRef<number>(Math.max(totalFloors, 1))
  const sliderCurrentRef = useRef<number>(Math.max(totalFloors, 1))
  const sliderAnimRef = useRef<number | null>(null)
  const scrollerRef = useRef<HTMLElement | null>(null)

  const getScrollContainer = () => {
    const root =
      anchorsRef.current[0]?.parentElement ||
      (document.scrollingElement as HTMLElement | null)
    let el: HTMLElement | null = root
    while (el) {
      const style = window.getComputedStyle(el)
      const oy = style.overflowY
      if (oy === "auto" || oy === "scroll") return el
      el = el.parentElement
    }
    return null
  }

  const getRelativeTop = (el: HTMLElement, container: HTMLElement | null) => {
    if (!container) {
      const rect = el.getBoundingClientRect()
      return rect.top + window.scrollY
    }
    const elRect = el.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    return elRect.top - cRect.top + container.scrollTop
  }

  useEffect(() => {
    authorRef.current = author
  }, [author])

  const updateLabelPos = () => {
    const wrap = sliderWrapRef.current
    if (!wrap) return
    const thumb = wrap.querySelector<HTMLElement>("[data-slot=slider-thumb]")
    if (!thumb) return
    const wrapRect = wrap.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    const center = thumbRect.top + thumbRect.height / 2 - wrapRect.top
    const pct =
      wrapRect.height > 0
        ? Math.max(0, Math.min(100, (center / wrapRect.height) * 100))
        : 0
    if (labelRef.current) labelRef.current.style.top = `${pct}%`
  }

  useEffect(() => {
    anchorsRef.current = Array.from(
      document.querySelectorAll<HTMLElement>("[data-post-anchor]")
    )
    scrollerRef.current = getScrollContainer()
    const measure = () => {
      const anchors = anchorsRef.current
      if (!anchors.length) return
      const scroller = scrollerRef.current
      const refAbs = scroller ? scroller.scrollTop : window.scrollY
      const n = anchors.length - 1
      if (n <= 0) return
      const positions: number[] = []
      for (let k = 1; k <= n; k++) {
        positions[k] = getRelativeTop(anchors[k], scroller)
      }
      const maxAbs = scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : (document.documentElement?.scrollHeight ||
            document.body.scrollHeight) - window.innerHeight
      const lastK = Math.max(1, Math.min(5, n - 1))
      const startIdx = Math.max(1, n - lastK)
      const startPos = positions[startIdx]
      if (refAbs >= startPos) {
        const denomLast = Math.max(1, maxAbs - startPos)
        const p = Math.max(0, Math.min(1, (refAbs - startPos) / denomLast))
        const frac = startIdx + p * lastK
        const s = totalFloors > 0 ? totalFloors - (frac - 1) : 1
        if (!isDraggingRef.current) {
          setSliderValue([s])
          sliderCurrentRef.current = s
          sliderTargetRef.current = s
        }
        const idxReply = Math.max(1, Math.min(n, Math.round(frac)))
        const el = anchors[idxReply]
        const name =
          el?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
            ?.textContent || ""
        if (idxReply !== currentRef.current) {
          currentRef.current = idxReply
          setCurrent(idxReply)
          setAuthor(name)
        } else if (!authorRef.current) {
          setAuthor(name)
        }
        window.requestAnimationFrame(() => {
          updateLabelPos()
        })
        return
      }
      let seg = 1
      if (refAbs <= positions[1]) {
        seg = 1
      } else {
        for (let k = 1; k < n; k++) {
          if (refAbs >= positions[k] && refAbs <= positions[k + 1]) {
            seg = k
            break
          }
          if (k === n - 1 && refAbs > positions[k + 1]) {
            seg = n - 1
          }
        }
      }
      const yA = positions[seg]
      const yB = positions[Math.min(seg + 1, n)]
      const denom = Math.max(1, yB - yA)
      const t = Math.min(1, Math.max(0, (refAbs - yA) / denom))
      const frac = seg + t
      const s = totalFloors > 0 ? totalFloors - (frac - 1) : 1
      if (!isDraggingRef.current) {
        setSliderValue([s])
        sliderCurrentRef.current = s
        sliderTargetRef.current = s
      }
      const idxReply = Math.max(1, Math.min(n, Math.round(frac)))
      const el = anchors[idxReply]
      const name =
        el?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
          ?.textContent || ""
      if (idxReply !== currentRef.current) {
        currentRef.current = idxReply
        setCurrent(idxReply)
        setAuthor(name)
      } else if (!authorRef.current) {
        setAuthor(name)
      }
      window.requestAnimationFrame(() => {
        updateLabelPos()
      })
    }
    const onScroll = () => {
      if (rafRef.current != null) return
      if (isDraggingRef.current) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        measure()
      })
    }
    const onResize = () => {
      anchorsRef.current = Array.from(
        document.querySelectorAll<HTMLElement>("[data-post-anchor]")
      )
      measure()
      window.requestAnimationFrame(() => {
        updateLabelPos()
      })
    }
    if (scrollerRef.current) {
      scrollerRef.current.addEventListener("scroll", onScroll, {
        passive: true,
      })
    } else {
      window.addEventListener("scroll", onScroll, {
        passive: true,
      })
    }
    window.addEventListener("resize", onResize)
    measure()
    window.requestAnimationFrame(() => {
      updateLabelPos()
    })
    return () => {
      if (scrollerRef.current)
        scrollerRef.current.removeEventListener("scroll", onScroll)
      else window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (sliderAnimRef.current != null) {
        window.cancelAnimationFrame(sliderAnimRef.current)
        sliderAnimRef.current = null
      }
    }
  }, [totalFloors, repliesLoading])

  const scrollToPost = (n: number) => {
    const id = `post-${n}`
    const el = document.getElementById(id)
    if (el) {
      const scroller = getScrollContainer()
      const top = getRelativeTop(el, scroller)
      if (scroller) {
        scroller.scrollTo({ top, behavior: "smooth" })
        if (Math.abs(scroller.scrollTop - top) > 1) scroller.scrollTop = top
      } else {
        window.scrollTo({ top, behavior: "smooth" })
        const se = document.scrollingElement as HTMLElement | null
        if (se && Math.abs(se.scrollTop - top) > 1) se.scrollTop = top
        if (Math.abs(window.scrollY - top) > 1) window.scrollTo(0, top)
      }
      setCurrent(Math.max(n - 1, 1))
      setSliderValue([totalFloors - n + 2])
      const anchorEl = anchorsRef.current[n - 1]
      const name =
        anchorEl?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
          ?.textContent || ""
      setAuthor(name)
    }
  }

  const jumpFirst = () => scrollToPost(2)
  const jumpLast = () => scrollToPost(totalFloors + 1)

  return (
    <div className="hidden lg:flex lg:flex-col sticky top-8 w-44 h-80 shrink-0 gap-3">
      <div className="flex flex-col items-center gap-3">
        {topicLoading ? (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </>
        ) : (
          <>
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (onReplyTopic) onReplyTopic()
                  else jumpLast()
                }}
              >
                <Reply />
                {t("replyToTopic")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  router.push(`/login`)
                }}
              >
                <LogIn />
                {t("goLogin")}
              </Button>
            )}
            <Button size="sm" variant="secondary" className="w-full">
              <ArrowDown10 />
              {t("sort")}
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-1 items-center mt-2">
        {repliesLoading ? (
          <div className="flex flex-1 items-center justify-center border-t border-b py-2">
            <Skeleton className="h-56 w-full" />
          </div>
        ) : totalFloors === 0 ? (
          <div className="flex flex-1 items-center justify-center border-t border-b py-2 text-sm text-muted-foreground">
            {t("noReplies")}
          </div>
        ) : (
          <TooltipProvider disableHoverableContent>
            <div className="flex flex-1 flex-col gap-3 border-t border-b py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("aria.toFirst")}
                    onClick={jumpFirst}
                    disabled={current <= 1}
                  >
                    <ChevronsUp className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("toFirst")}</TooltipContent>
              </Tooltip>
              <div className="flex-1 w-full flex items-center pl-4.5">
                <div
                  ref={sliderWrapRef}
                  className="relative h-full flex items-center"
                >
                  <Slider
                    orientation="vertical"
                    min={1}
                    max={totalFloors}
                    step={0.001}
                    value={sliderValue}
                    onValueChange={(v) => {
                      isDraggingRef.current = true
                      setSliderValue(v)
                      const anchors = anchorsRef.current
                      if (anchors.length > 0) {
                        const s = v[0]
                        const t =
                          totalFloors > 1
                            ? (totalFloors - s) / (totalFloors - 1)
                            : 0
                        const idxFloat = t * (totalFloors - 1)
                        const iReply = Math.floor(idxFloat) + 1
                        const f = Math.min(
                          1,
                          Math.max(0, idxFloat - Math.floor(idxFloat))
                        )
                        const scroller = getScrollContainer()
                        const posIEl = anchors[iReply]
                        const posJEl =
                          anchors[Math.min(iReply + 1, totalFloors)] || posIEl
                        let yI = 0
                        if (posIEl) {
                          yI = getRelativeTop(posIEl, scroller)
                        }
                        let yJ = yI
                        if (posJEl) {
                          yJ = getRelativeTop(posJEl, scroller)
                        }
                        const y = yI * (1 - f) + yJ * f
                        if (scroller)
                          scroller.scrollTo({ top: y, behavior: "auto" })
                        else window.scrollTo({ top: y, behavior: "auto" })
                        setCurrent(iReply)
                        currentRef.current = iReply
                        const name =
                          anchors[iReply]?.querySelector<HTMLElement>(
                            "[data-slot=timeline-steps-title]"
                          )?.textContent || ""
                        setAuthor(name)
                      }
                      window.requestAnimationFrame(() => {
                        updateLabelPos()
                      })
                    }}
                    onValueCommit={(v) => {
                      isDraggingRef.current = false
                      scrollToPost(totalFloors - v[0] + 2)
                    }}
                    className="h-full [&_[data-slot=slider-track]]:w-px [&_[data-slot=slider-track]]:bg-border [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:w-[5px] [&_[data-slot=slider-thumb]]:h-16 [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:border-0"
                  />
                  <div
                    className="absolute left-full ml-3 -translate-y-1/2 flex flex-col items-start w-32"
                    ref={labelRef}
                  >
                    <span className="font-bold">
                      {current} / {totalFloors}
                    </span>
                    <span className="text-muted-foreground max-w-[120px] truncate whitespace-nowrap">
                      {author || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("aria.toLast")}
                    onClick={jumpLast}
                    disabled={current >= totalFloors}
                  >
                    <ChevronsDown className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("toLast")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
