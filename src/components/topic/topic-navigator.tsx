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
import { cn } from "@/lib/utils"

type TopicNavigatorProps = {
  total: number // 服务器返回的总帖子数（用于显示）
  loadedCount?: number // 当前已加载的帖子数（用于滑块计算）
  isAuthenticated?: boolean
  onReplyTopic?: () => void
  topicLoading?: boolean
  repliesLoading?: boolean
}

export function TopicNavigator({
  total,
  loadedCount,
  isAuthenticated,
  onReplyTopic,
  topicLoading,
  repliesLoading,
  className,
}: TopicNavigatorProps & { className?: string }) {
  const t = useTranslations("Topic.Navigator")
  const router = useRouter()
  // 用于显示的总楼层数（基于服务器总数）
  const totalFloors = Math.max(total - 1, 0)
  // 用于滑块计算的实际楼层数（基于已加载的帖子数）
  const actualFloors = Math.max((loadedCount ?? total) - 1, 0)
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
  const sliderAnimRef = useRef<number | null>(null)
  const scrollerRef = useRef<HTMLElement | null>(null)
  const displayCurrent: number = Math.max(current, 1)
  // 尾部楼层覆盖策略常量
  const RESERVE_PX = 24 // 尾部保留像素
  const TAIL_THRESHOLD_FLOORS = 5 // 触发尾部特殊处理的剩余楼层阈值

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

  const updateFloorHash = (floor: number) => {
    if (typeof window === "undefined") return
    if (!Number.isFinite(floor)) return
    const safeFloor = Math.max(1, Math.floor(floor))
    const hash = `#floor-${safeFloor}`
    if (window.location.hash === hash) return
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${hash}`
    )
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
    /**
     * 收集锚点函数:从 DOM 中重新收集所有帖子锚点
     * 支持动态加载场景,确保新增的帖子节点也能被收集
     */
    const collectAnchors = () => {
      const newAnchors = Array.from(
        document.querySelectorAll<HTMLElement>("[data-post-anchor]")
      )
      anchorsRef.current = newAnchors
      return newAnchors.length
    }

    // 初始收集锚点
    collectAnchors()
    // 获取滚动容器
    scrollerRef.current = getScrollContainer()

    /**
     * 核心计算函数:根据当前滚动位置计算并更新滑块状态
     * 根据设计文档的统一坐标映射公式实现
     */
    const measure = () => {
      const anchors = anchorsRef.current
      // 使用实际 DOM 中的锚点数量（排除主楼 post-1）
      const n = anchors.length - 1

      // 边界情况处理
      if (n <= 0) return

      const scroller = scrollerRef.current
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY

      // 计算最大滚动高度
      const maxScrollHeight = scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : (document.documentElement?.scrollHeight ||
            document.body.scrollHeight) - window.innerHeight

      // 特殊情况：仅有1楼
      if (n === 1) {
        if (!isDraggingRef.current) {
          // 只有1楼时，滑块设置在中间位置（max=2时，1.5为中间）
          setSliderValue([1.5])
        }
        const el = anchors[1]
        const name =
          el?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
            ?.textContent || ""
        if (currentRef.current !== 1) {
          currentRef.current = 1
          setCurrent(1)
          setAuthor(name)
        } else if (!authorRef.current) {
          setAuthor(name)
        }
        window.requestAnimationFrame(() => {
          updateLabelPos()
        })
        return
      }

      // 收集所有楼层的位置（从1楼开始）
      const positions: number[] = []
      for (let i = 1; i <= n; i++) {
        positions[i] = getRelativeTop(anchors[i], scroller)
      }

      // 判断是否需要尾部特殊处理
      const lastAnchorTop = positions[n]
      const needTailHandling = lastAnchorTop > maxScrollHeight - RESERVE_PX

      let floorFloat: number // 当前对应的楼层号（浮点）

      if (!needTailHandling) {
        // 全局线性映射
        const scrollProgress =
          maxScrollHeight > 0 ? scrollTop / maxScrollHeight : 0
        floorFloat = 1 + scrollProgress * (n - 1)
      } else {
        // 双区域映射策略
        const lastStartFloor = Math.max(1, n - TAIL_THRESHOLD_FLOORS)
        const lastStartAnchorTop = positions[lastStartFloor]

        if (scrollTop <= lastStartAnchorTop) {
          // 常规区：线性映射
          const scrollProgress =
            lastStartAnchorTop > 0 ? scrollTop / lastStartAnchorTop : 0
          floorFloat = 1 + scrollProgress * (lastStartFloor - 1)
        } else {
          // 尾部区：线性映射
          const tailScrollRange = Math.max(
            1,
            maxScrollHeight - lastStartAnchorTop - RESERVE_PX
          )
          const tailProgress =
            (scrollTop - lastStartAnchorTop) / tailScrollRange
          const clampedTailProgress = Math.max(0, Math.min(1, tailProgress))
          floorFloat =
            lastStartFloor + clampedTailProgress * (n - lastStartFloor)
        }
      }

      // 限制 floorFloat 在有效范围内
      floorFloat = Math.max(1, Math.min(n, floorFloat))

      // 转换为滑块值（注意方向相反）
      const sliderValue = n - floorFloat + 1

      // 更新滑块位置（仅在非拖动状态下）
      if (!isDraggingRef.current) {
        setSliderValue([sliderValue])
      }

      // 定位当前楼层的锚点索引
      const currentFloor = Math.round(floorFloat)
      const anchorIndex = currentFloor // anchors[i] 对应 i 楼
      const el = anchors[anchorIndex]
      const name =
        el?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
          ?.textContent || ""

      // 仅在楼层变化时更新状态（性能优化）
      if (currentFloor !== currentRef.current) {
        currentRef.current = currentFloor
        setCurrent(currentFloor)
        updateFloorHash(currentFloor)
        setAuthor(name)
      } else if (!authorRef.current) {
        setAuthor(name)
      }

      // 更新标签位置
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
      collectAnchors()
      measure()
      window.requestAnimationFrame(() => {
        updateLabelPos()
      })
    }

    // 监听 DOM 变化,当新的帖子节点被添加时重新收集锚点
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          // 检查是否有新增的锚点节点
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              if (
                node.hasAttribute("data-post-anchor") ||
                node.querySelector("[data-post-anchor]")
              ) {
                shouldUpdate = true
                break
              }
            }
          }
        }
        if (shouldUpdate) break
      }
      if (shouldUpdate) {
        const prevCount = anchorsRef.current.length
        const newCount = collectAnchors()
        // 只有当锚点数量变化时才重新计算
        if (newCount !== prevCount) {
          // 延迟执行,确保 DOM 完全更新
          setTimeout(() => {
            measure()
            window.requestAnimationFrame(() => {
              updateLabelPos()
            })
          }, 100)
        }
      }
    })

    // 观察包含帖子列表的容器
    const container = document.querySelector('[data-slot="timeline-steps"]')
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
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

    // 初始测量:延迟执行确保 DOM 完全渲染
    setTimeout(() => {
      collectAnchors()
      measure()
      window.requestAnimationFrame(() => {
        updateLabelPos()
      })
    }, 100)

    return () => {
      observer.disconnect()
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
  }, [actualFloors, repliesLoading])

  const scrollToPost = (n: number) => {
    const id = `post-${n}`
    const el = document.getElementById(id)
    if (el) {
      // 设置拖动标志，防止 smooth 滚动过程中 measure() 覆盖滑块位置
      isDraggingRef.current = true
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
      // 帖子编号转楼层号：帖子1是主楼，帖子2是1楼，以此类推
      const floor = Math.max(n - 1, 1)
      setCurrent(floor)
      currentRef.current = floor
      updateFloorHash(floor)
      // 滑块值计算：楼层号越大，滑块值越小（方向相反）
      // 使用实际已加载的楼层数
      const loadedFloors = anchorsRef.current.length - 1
      setSliderValue([loadedFloors - floor + 1])
      // 更新作者信息：anchorsRef[i] 对应 post-${i+1}，所以使用 n-1 索引
      const anchorEl = anchorsRef.current[n - 1]
      const name =
        anchorEl?.querySelector<HTMLElement>("[data-slot=timeline-steps-title]")
          ?.textContent || ""
      setAuthor(name)
      // 更新标签位置：等待 React 更新 DOM 后再计算
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateLabelPos()
        })
      })
      // 滚动完成后释放拖动标志
      setTimeout(() => {
        isDraggingRef.current = false
      }, 500)
    }
  }

  const jumpFirst = () => scrollToPost(2)
  // 跳转到最后一楼：使用实际已加载的楼层数
  const jumpLast = () => {
    const loadedFloors = anchorsRef.current.length - 1
    scrollToPost(loadedFloors + 1)
  }

  return (
    <div
      className={cn(
        "hidden lg:flex lg:flex-col sticky top-8 w-44 h-80 shrink-0 gap-3",
        className
      )}
    >
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
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-72 w-full" />
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
                    max={Math.max(actualFloors, 2)} // 确保至少有2的范围，避免单楼层时滑块在底部
                    step={0.001}
                    value={sliderValue}
                    disabled={actualFloors === 1} // 单楼层时禁用滑块
                    onValueChange={(v) => {
                      // 设置拖动标志
                      isDraggingRef.current = true
                      setSliderValue(v)

                      const anchors = anchorsRef.current
                      // 使用实际 DOM 中的锚点数量
                      const n = anchors.length - 1
                      if (n <= 0) return

                      const s = v[0] // 当前滑块值
                      // 反推楼层号（浮点）
                      const floorFloat = n - s + 1

                      // 计算插值位置：支持中间位置的平滑滚动
                      const lowerFloor = Math.floor(floorFloat)
                      const upperFloor = Math.ceil(floorFloat)
                      const fraction = floorFloat - lowerFloor

                      // 确保楼层索引在有效范围内
                      const safeLower = Math.max(1, Math.min(n, lowerFloor))
                      const safeUpper = Math.max(1, Math.min(n, upperFloor))

                      const scroller = getScrollContainer()
                      const lowerAnchor = anchors[safeLower]
                      const upperAnchor = anchors[safeUpper]

                      if (lowerAnchor && upperAnchor) {
                        const lowerTop = getRelativeTop(lowerAnchor, scroller)
                        const upperTop = getRelativeTop(upperAnchor, scroller)
                        // 插值计算目标滚动位置
                        const targetScrollTop =
                          lowerTop * (1 - fraction) + upperTop * fraction

                        // 拖动中使用 auto 立即跳转，避免动画延迟
                        if (scroller) {
                          scroller.scrollTo({
                            top: targetScrollTop,
                            behavior: "auto",
                          })
                        } else {
                          window.scrollTo({
                            top: targetScrollTop,
                            behavior: "auto",
                          })
                        }
                      }

                      // 更新当前楼层信息
                      const currentFloor = Math.round(floorFloat)
                      setCurrent(currentFloor)
                      currentRef.current = currentFloor

                      const anchorEl = anchors[currentFloor]
                      const name =
                        anchorEl?.querySelector<HTMLElement>(
                          "[data-slot=timeline-steps-title]"
                        )?.textContent || ""
                      setAuthor(name)

                      // 更新标签位置
                      window.requestAnimationFrame(() => {
                        updateLabelPos()
                      })
                    }}
                    onValueCommit={(v) => {
                      // 释放拖动标志
                      isDraggingRef.current = false

                      // 计算目标楼层：使用实际 DOM 中的锚点数量
                      const n = anchorsRef.current.length - 1
                      if (n <= 0) return

                      const floorFloat = n - v[0] + 1
                      const targetFloor = Math.max(
                        1,
                        Math.min(n, Math.round(floorFloat))
                      )
                      const anchorIndex = targetFloor
                      updateFloorHash(targetFloor)

                      const scroller = getScrollContainer()
                      const targetAnchor = anchorsRef.current[anchorIndex]

                      if (targetAnchor) {
                        const top = getRelativeTop(targetAnchor, scroller)

                        // 释放时使用 smooth 平滑滚动
                        if (scroller) {
                          scroller.scrollTo({ top, behavior: "smooth" })
                          // fallback: 确保滚动到位
                          setTimeout(() => {
                            if (Math.abs(scroller.scrollTop - top) > 1) {
                              scroller.scrollTop = top
                            }
                          }, 300)
                        } else {
                          window.scrollTo({ top, behavior: "smooth" })
                          // fallback: 确保滚动到位
                          setTimeout(() => {
                            const se =
                              document.scrollingElement as HTMLElement | null
                            if (se && Math.abs(se.scrollTop - top) > 1) {
                              se.scrollTop = top
                            }
                            if (Math.abs(window.scrollY - top) > 1) {
                              window.scrollTo(0, top)
                            }
                          }, 300)
                        }
                      }
                    }}
                    className="h-full [&_[data-slot=slider-track]]:w-px [&_[data-slot=slider-track]]:bg-border [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:w-[5px] [&_[data-slot=slider-thumb]]:h-16 [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:border-0"
                  />
                  <div
                    className="absolute left-full ml-3 -translate-y-1/2 flex flex-col items-start w-32"
                    ref={labelRef}
                  >
                    <span className="font-bold">
                      {displayCurrent} / {totalFloors}
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
                    disabled={current >= actualFloors}
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
