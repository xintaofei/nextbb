"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface ConfigSectionProps {
  title: string
  description?: string
  children: ReactNode
  delay?: number
}

export function ConfigSection({
  title,
  description,
  children,
  delay = 0,
}: ConfigSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4 rounded-lg border p-6">{children}</div>
    </motion.div>
  )
}
