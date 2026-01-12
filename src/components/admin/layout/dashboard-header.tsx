"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Settings } from "lucide-react"

export function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 space-y-4"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur"
            aria-label="Dashboard status: Live"
          >
            <span
              className="h-2 w-2 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            Live Dashboard
          </Badge>

          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Performance Overview
          </h1>
          <p className="max-w-2xl text-foreground/70">
            Monitor your application metrics, user activity, and system health
            in real-time with detailed insights and historical data trends.
          </p>
        </div>

        <div
          className="flex gap-2"
          role="toolbar"
          aria-label="Dashboard actions"
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border/40 bg-background/60 backdrop-blur hover:border-border/60 hover:bg-background/70"
            aria-label="Download report"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-border/40 bg-background/60 backdrop-blur hover:border-border/60 hover:bg-background/70"
            aria-label="Dashboard settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
