import { useEffect, useMemo, useRef, useState, useCallback } from "react"

export function useDebouncedCallback<Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debounced = useMemo(() => {
    const func = (...args: Args) => {
      setIsPending(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
        setIsPending(false)
      }, delay)
    }
    return func
  }, [delay])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    setIsPending(false)
  }, [])

  return { debounced, isPending, cancel }
}
