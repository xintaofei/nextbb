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

export interface ChartLineConfig {
  dataKey: string
  label: string
  color: string
}

export interface ChartCardProps {
  title: string
  description: string
  data: Record<string, unknown>[]
  lines?: ChartLineConfig[]
  dataKey?: string
  height?: number
  headerAction?: React.ReactNode
}

export function ChartCard({
  title,
  description,
  data,
  lines,
  dataKey,
  height = 300,
  headerAction,
}: ChartCardProps) {
  const chartLines =
    lines ||
    (dataKey ? [{ dataKey, label: title, color: "var(--primary)" }] : [])

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
          <div className="flex items-center gap-2">
            {headerAction}
            <button
              className="text-foreground/40 hover:text-foreground/70 transition-colors p-2 hover:bg-background/50 rounded-lg"
              aria-label={`View details for ${title}`}
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Chart Container with proper sizing */}
        <div style={{ width: "100%", height: height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                {chartLines.map((line) => (
                  <linearGradient
                    key={`colorGradient-${line.dataKey}`}
                    id={`colorGradient-${line.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={line.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={line.color}
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                ))}
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
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--foreground)"
                opacity={0.6}
                style={{ fontSize: "11px" }}
                width={40}
                tickLine={false}
                axisLine={false}
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
              {chartLines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                  fill={`url(#colorGradient-${line.dataKey})`}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend/Category List */}
        {chartLines.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/20 pt-4">
            {chartLines.map((line) => (
              <div
                key={line.dataKey}
                className="group/legend flex items-center gap-2"
              >
                <div
                  className="h-2 w-2 rounded-full transition-transform group-hover/legend:scale-125"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-[11px] font-medium text-foreground/60 transition-colors group-hover/legend:text-foreground">
                  {line.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
