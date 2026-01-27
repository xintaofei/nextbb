"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"

interface NewTopicContextValue {
  openDialog: () => void
  registerOnPublished: (callback: () => void) => () => void
}

const NewTopicContext = createContext<NewTopicContextValue | undefined>(
  undefined
)

interface NewTopicProviderProps {
  children: ReactNode
}

/**
 * 新建话题上下文提供者
 *
 * 管理新建话题对话框的状态，支持跨组件触发和回调注册
 */
export function NewTopicProvider({ children }: NewTopicProviderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const callbacksRef = useRef<Set<() => void>>(new Set())

  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const registerOnPublished = useCallback((callback: () => void) => {
    callbacksRef.current.add(callback)
    // 返回取消注册函数
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  const handlePublished = useCallback(() => {
    // 执行所有注册的回调
    callbacksRef.current.forEach((callback) => callback())
  }, [])

  const contextValue = useMemo(
    () => ({ openDialog, registerOnPublished }),
    [openDialog, registerOnPublished]
  )

  return (
    <NewTopicContext.Provider value={contextValue}>
      {children}
      <NewTopicDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPublished={handlePublished}
      />
    </NewTopicContext.Provider>
  )
}

/**
 * 使用新建话题上下文的 Hook
 *
 * 必须在 NewTopicProvider 内部使用
 */
export function useNewTopic(): NewTopicContextValue {
  const context = useContext(NewTopicContext)

  if (context === undefined) {
    throw new Error("useNewTopic must be used within NewTopicProvider")
  }

  return context
}
