"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

export interface MetricCardProps {
  label: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ReactNode
}

export function MetricCard({
  label,
  value,
  change,
  trend,
  icon,
}: MetricCardProps) {
  const isPositive = trend === "up"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={`${label}: ${value}, ${change} ${trend === "up" ? "increase" : "decrease"}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl" aria-hidden="true">
            {icon}
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            }`}
            aria-live="polite"
            aria-label={`${change} ${trend === "up" ? "increase" : "decrease"}`}
          >
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {change}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
