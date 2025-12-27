import { ReactNode } from "react"

export interface AdminPageContainerProps {
  children: ReactNode
}

/**
 * 管理页面统一的容器组件
 * 提供标准的内外边距和最大宽度限制
 */
export function AdminPageContainer({ children }: AdminPageContainerProps) {
  return (
    <div className="relative px-6 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  )
}
