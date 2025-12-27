import { motion, Variants } from "framer-motion"
import { Users, Zap, Percent, DollarSign } from "lucide-react"
import { ChartCard } from "@/components/admin/cards/chat-card"
import { DetailedCard } from "@/components/admin/cards/detailed-card"
import { MetricCard } from "@/components/admin/stats/metric-card"

const USER_GROWTH_DATA = [
  { name: "Week 1", value: 2400 },
  { name: "Week 2", value: 3210 },
  { name: "Week 3", value: 2290 },
  { name: "Week 4", value: 2000 },
  { name: "Week 5", value: 2181 },
  { name: "Week 6", value: 2500 },
  { name: "Week 7", value: 2100 },
  { name: "Week 8", value: 2200 },
  { name: "Week 9", value: 2290 },
  { name: "Week 10", value: 2000 },
  { name: "Week 11", value: 2181 },
  { name: "Week 12", value: 2500 },
  { name: "Week 13", value: 2100 },
]

const REVENUE_TREND_DATA = [
  { name: "Week 1", value: 4000 },
  { name: "Week 2", value: 3000 },
  { name: "Week 3", value: 2000 },
  { name: "Week 4", value: 2780 },
  { name: "Week 5", value: 1890 },
  { name: "Week 6", value: 2390 },
  { name: "Week 7", value: 3490 },
  { name: "Week 8", value: 4000 },
  { name: "Week 9", value: 3500 },
  { name: "Week 10", value: 4200 },
  { name: "Week 11", value: 3800 },
  { name: "Week 12", value: 4500 },
  { name: "Week 13", value: 4100 },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export function DashboardGrid() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      role="region"
      aria-label="Dashboard metrics and charts"
    >
      {/* Top KPI Row - Replaced emoji icons with lucide icons */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        role="presentation"
      >
        <MetricCard
          label="Total Users"
          value="24,582"
          change="+12.5%"
          trend="up"
          icon={<Users className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="Active Sessions"
          value="8,924"
          change="+8.2%"
          trend="up"
          icon={<Zap className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="Conversion Rate"
          value="3.47%"
          change="-1.3%"
          trend="down"
          icon={<Percent className="h-6 w-6 text-primary" aria-hidden="true" />}
        />
        <MetricCard
          label="Revenue"
          value="$47,320"
          change="+24.8%"
          trend="up"
          icon={
            <DollarSign className="h-6 w-6 text-primary" aria-hidden="true" />
          }
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-2"
        role="presentation"
      >
        <ChartCard
          title="User Growth"
          description="Last 13 weeks activity"
          data={USER_GROWTH_DATA}
          dataKey="value"
          height={300}
        />
        <ChartCard
          title="Revenue Trend"
          description="Weekly revenue breakdown"
          data={REVENUE_TREND_DATA}
          dataKey="value"
          height={300}
        />
      </motion.div>

      {/* Detailed Cards Row */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-3"
        role="presentation"
      >
        <DetailedCard
          title="Top Pages"
          items={[
            { label: "Home", value: "12,543", subtitle: "visits" },
            { label: "Dashboard", value: "8,324", subtitle: "visits" },
            { label: "Settings", value: "4,128", subtitle: "visits" },
          ]}
        />
        <DetailedCard
          title="Browser Usage"
          items={[
            { label: "Chrome", value: "68.5%", subtitle: "market share" },
            { label: "Safari", value: "18.2%", subtitle: "market share" },
            { label: "Firefox", value: "9.3%", subtitle: "market share" },
          ]}
        />
        <DetailedCard
          title="Recent Activity"
          items={[
            { label: "Login Spike", value: "Now", subtitle: "2.5k users" },
            { label: "Feature Update", value: "2h ago", subtitle: "deployed" },
            { label: "Bug Fix", value: "5h ago", subtitle: "resolved" },
          ]}
        />
      </motion.div>
    </motion.div>
  )
}
