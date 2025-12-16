"use client"

import { useEffect, useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronsUp, ChevronsDown } from "lucide-react"
import { useTranslations } from "next-intl"

type TopicNavigatorProps = {
  total: number
}

export function TopicNavigator({ total }: TopicNavigatorProps) {
  const t = useTranslations("Topic.Navigator")
  const totalFloors = Math.max(total - 1, 1)
  const [current, setCurrent] = useState(1)
  const [sliderValue, setSliderValue] = useState<number[]>([totalFloors])
  const anchorsRef = useRef<HTMLElement[]>([])
  const rafRef = useRef<number | null>(null)
  const [author, setAuthor] = useState("")
  const sliderWrapRef = useRef<HTMLDivElement | null>(null)
  const [labelTop, setLabelTop] = useState("0%")
  const isDraggingRef = useRef(false)

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
    setLabelTop(`${pct}%`)
  }

  useEffect(() => {
    anchorsRef.current = Array.from(
      document.querySelectorAll<HTMLElement>("[data-post-anchor]")
    )
    const measure = () => {
      const anchors = anchorsRef.current
      if (!anchors.length) return
      const refAbs = window.scrollY
      let firstVisible = 1
      for (let k = 1; k < anchors.length; k++) {
        const rect = anchors[k].getBoundingClientRect()
        if (rect.top >= 0) {
          firstVisible = k
          break
        }
        if (k === anchors.length - 1) {
          firstVisible = k
        }
      }
      const i = Math.min(Math.max(firstVisible, 1), anchors.length - 1)
      const j = Math.min(i + 1, anchors.length - 1)
      const posI = anchors[i].offsetTop
      const posJ = anchors[j].offsetTop
      const denom = Math.max(1, posJ - posI)
      const t = Math.min(1, Math.max(0, (refAbs - posI) / denom))
      setSliderValue([totalFloors - (i - 1) - t])
      const idxReply = i
      if (idxReply !== current) {
        setCurrent(idxReply)
        const el = anchors[i]
        const name =
          el?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
            ?.textContent || ""
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
        window.requestAnimationFrame(() => {
          updateLabelPos()
        })
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
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    measure()
    window.requestAnimationFrame(() => {
      updateLabelPos()
    })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [total])

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
      window.requestAnimationFrame(() => {
        updateLabelPos()
      })
    }
  }

  const jumpFirst = () => scrollToPost(2)
  const jumpPrev = () => scrollToPost(Math.max(current - 1, 1))
  const jumpNext = () => scrollToPost(Math.min(current + 1, total))
  const jumpLast = () => scrollToPost(totalFloors + 1)

  return (
    <div className="flex flex-col sticky top-8 w-64 h-80 shrink-0 border rounded-xl p-3 gap-3 hidden lg:flex">
      <div className="flex flex-1 items-center justify-center">
        <TooltipProvider disableHoverableContent>
          <div className="flex flex-1 flex-col items-center gap-3">
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
              <TooltipContent>{t("toFirst")}</TooltipContent>
            </Tooltip>
            <div className="flex-1 w-full flex items-center justify-center">
              <div
                ref={sliderWrapRef}
                className="relative h-full flex items-center"
              >
                <Slider
                  orientation="vertical"
                  min={1}
                  max={totalFloors}
                  step={0.01}
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
                      const yI = posIEl ? getRelativeTop(posIEl, scroller) : 0
                      const yJ = posJEl ? getRelativeTop(posJEl, scroller) : yI
                      const y = yI * (1 - f) + yJ * f
                      if (scroller)
                        scroller.scrollTo({ top: y, behavior: "auto" })
                      else window.scrollTo({ top: y, behavior: "auto" })
                      setCurrent(iReply)
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
                  className="h-full [&_[data-slot=slider-track]]:w-px [&_[data-slot=slider-track]]:bg-border [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:w-[9px] [&_[data-slot=slider-thumb]]:h-16 [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:border-0"
                />
                <div
                  className="absolute left-full ml-2 -translate-y-1/2 flex flex-col items-start text-xs"
                  style={{
                    top: labelTop,
                  }}
                >
                  <span className="font-medium">
                    {current}/{totalFloors}
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
              <TooltipContent>{t("toLast")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
