import { motion } from "framer-motion"
import { ReactNode } from "react"

export interface AdminPageSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * 管理页面统一的动画包裹组件
 * 用于为页面各个区块提供一致的进入动画效果
 */
export function AdminPageSection({
  children,
  delay = 0,
  className = "",
}: AdminPageSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
