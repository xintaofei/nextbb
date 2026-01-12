"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

export interface DetailItem {
  label: string
  value: string
  subtitle: string
}

export interface DetailedCardProps {
  title: string
  items: DetailItem[]
}

export function DetailedCard({ title, items }: DetailedCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
          {title}
        </h3>

        <div className="space-y-3" role="list" aria-label={`${title} list`}>
          {items.map((item, index) => (
            <motion.button
              key={`${item.label}-${index}`}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className="group/item w-full text-left"
              role="listitem"
              aria-label={`${item.label}: ${item.value} (${item.subtitle})`}
            >
              <div className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-foreground/60">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                  <ChevronRight
                    className="h-4 w-4 text-foreground/40 transition-transform group-hover/item:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
