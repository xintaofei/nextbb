import { useEffect, useRef, RefObject } from "react"

/**
 * 实现智能粘性侧边栏效果（类似 Twitter）：
 * - 当侧边栏内容短于视口：正常 sticky 固定在顶部
 * - 当侧边栏内容长于视口：根据滚动方向动态调整 top，
 *   向下滚动时露出底部内容，向上滚动时露出顶部内容
 */
export function useStickySidebar(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)
  const state = useRef({
    prevScrollY: 0,
    currentTop: 0,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (): void => {
      const scrollY = window.scrollY
      const deltaY = scrollY - state.current.prevScrollY
      const sidebarHeight = el.offsetHeight
      const viewportHeight = window.innerHeight

      if (sidebarHeight <= viewportHeight) {
        // 侧边栏内容短于视口，简单置顶
        state.current.currentTop = 0
      } else {
        // 侧边栏内容超出视口，根据滚动方向动态调整
        const minTop = viewportHeight - sidebarHeight

        if (deltaY > 0) {
          // 向下滚动：top 逐渐减小，露出底部内容
          state.current.currentTop = Math.max(
            minTop,
            state.current.currentTop - deltaY
          )
        } else {
          // 向上滚动：top 逐渐增大，露出顶部内容
          state.current.currentTop = Math.min(
            0,
            state.current.currentTop - deltaY
          )
        }
      }

      el.style.top = `${state.current.currentTop}px`
      state.current.prevScrollY = scrollY
    }

    // 内容高度变化时（如数据加载完成）重新计算
    const resizeObserver = new ResizeObserver(() => {
      const sidebarHeight = el.offsetHeight
      const viewportHeight = window.innerHeight
      const minTop = viewportHeight - sidebarHeight

      // 确保 currentTop 仍在有效范围内
      if (sidebarHeight <= viewportHeight) {
        state.current.currentTop = 0
      } else {
        state.current.currentTop = Math.max(
          minTop,
          Math.min(0, state.current.currentTop)
        )
      }
      el.style.top = `${state.current.currentTop}px`
    })

    // 初始化
    state.current.prevScrollY = window.scrollY
    update()

    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    resizeObserver.observe(el)

    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      resizeObserver.disconnect()
    }
  }, [])

  return ref
}
