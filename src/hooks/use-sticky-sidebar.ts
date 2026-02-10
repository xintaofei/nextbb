import { useEffect, useRef, RefObject } from "react"

/**
 * 实现智能粘性侧边栏效果（类似 Twitter）：
 * - 当侧边栏内容短于视口：正常 sticky 固定在顶部
 * - 当侧边栏内容长于视口：根据滚动方向动态调整 top，
 *   向下滚动时露出底部内容，向上滚动时露出顶部内容
 */
export function useStickySidebar(
  resetKey?: string
): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)
  const state = useRef({
    prevScrollY: 0,
    currentTop: 0,
    sidebarHeight: 0,
    rafId: 0,
  })

  // 页面导航时重置状态，避免 prevScrollY 与实际滚动位置脱节
  useEffect(() => {
    state.current.prevScrollY = window.scrollY
    state.current.currentTop = 0
    if (ref.current) {
      ref.current.style.top = "0px"
    }
  }, [resetKey])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sidebarState = state.current

    const compute = (): void => {
      const current = ref.current
      if (!current) return

      const scrollY = window.scrollY
      const deltaY = scrollY - sidebarState.prevScrollY
      const { sidebarHeight } = sidebarState
      const viewportHeight = window.innerHeight

      if (sidebarHeight <= viewportHeight) {
        sidebarState.currentTop = 0
      } else {
        const minTop = viewportHeight - sidebarHeight

        if (deltaY > 0) {
          sidebarState.currentTop = Math.max(
            minTop,
            sidebarState.currentTop - deltaY
          )
        } else {
          sidebarState.currentTop = Math.min(
            0,
            sidebarState.currentTop - deltaY
          )
        }
      }

      current.style.top = `${sidebarState.currentTop}px`
      sidebarState.prevScrollY = scrollY
    }

    const onScroll = (): void => {
      if (sidebarState.rafId) return
      sidebarState.rafId = requestAnimationFrame(() => {
        sidebarState.rafId = 0
        compute()
      })
    }

    const resizeObserver = new ResizeObserver(() => {
      const current = ref.current
      if (!current) return

      // 仅在 ResizeObserver 中读取 offsetHeight，缓存到 state
      sidebarState.sidebarHeight = current.offsetHeight
      const viewportHeight = window.innerHeight
      const minTop = viewportHeight - sidebarState.sidebarHeight

      if (sidebarState.sidebarHeight <= viewportHeight) {
        sidebarState.currentTop = 0
      } else {
        sidebarState.currentTop = Math.max(
          minTop,
          Math.min(0, sidebarState.currentTop)
        )
      }
      current.style.top = `${sidebarState.currentTop}px`
    })

    // 初始化：缓存高度并计算一次
    sidebarState.prevScrollY = window.scrollY
    sidebarState.sidebarHeight = el.offsetHeight
    compute()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    resizeObserver.observe(el)

    return () => {
      cancelAnimationFrame(sidebarState.rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  return ref
}
