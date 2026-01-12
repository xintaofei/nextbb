"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
} from "recharts"

export interface ChartCardProps {
  title: string
  description: string
  data: Array<{ name: string; value: number }>
  dataKey: string
  height?: number
}

export function ChartCard({
  title,
  description,
  data,
  dataKey,
  height = 300,
}: ChartCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
      role="article"
      aria-label={`${title} chart: ${description}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
              {title}
            </h3>
            <p className="text-xs text-foreground/60">{description}</p>
          </div>
          <button
            className="text-foreground/40 hover:text-foreground/70 transition-colors p-2 hover:bg-background/50 rounded-lg"
            aria-label={`View details for ${title}`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Chart Container with proper sizing */}
        <div style={{ width: "100%", height: height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id={`colorGradient-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--foreground)"
                opacity={0.6}
                style={{ fontSize: "11px" }}
              />
              <YAxis
                stroke="var(--foreground)"
                opacity={0.6}
                style={{ fontSize: "11px" }}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  opacity: 0.95,
                  border: `1px solid var(--border)`,
                  borderRadius: "8px",
                  backdropFilter: "blur(12px)",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                cursor={{ stroke: "var(--primary)", strokeOpacity: 0.2 }}
              />
              <Line
                type="natural"
                dataKey={dataKey}
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6 }}
                fill={`url(#colorGradient-${title})`}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
