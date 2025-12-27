"use client"

import { motion } from "framer-motion"
import {
  BarChart3,
  Users,
  Menu,
  Folder,
  Tag,
  FileText,
  Award,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations("Admin.nav")

  const navItems = [
    { label: t("overview"), icon: BarChart3, path: "/admin" },
    { label: t("topics"), icon: FileText, path: "/admin/topics" },
    { label: t("users"), icon: Users, path: "/admin/users" },
    { label: t("categories"), icon: Folder, path: "/admin/categories" },
    { label: t("tags"), icon: Tag, path: "/admin/tags" },
    { label: t("badges"), icon: Award, path: "/admin/badges" },
    { label: t("settings"), icon: Settings, path: "/admin/settings" },
  ]

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-6 border-b border-border/40 bg-background/40 backdrop-blur-md"
      role="navigation"
      aria-label="Main dashboard navigation"
    >
      <div className="mx-auto max-w-7xl py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-foreground tracking-tight">
            NextBB Admin
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-background/60 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop nav */}
          <div
            className="hidden md:flex gap-1"
            role="menubar"
            aria-label="Navigation tabs"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-foreground/70 hover:text-foreground hover:bg-background/50 rounded-lg"
                  role="menuitem"
                  aria-current={item.path === "/admin" ? "page" : undefined}
                  onClick={() => router.push(item.path)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs uppercase tracking-widest">
                    {item.label}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-col gap-2 md:hidden"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-foreground/70 hover:text-foreground hover:bg-background/50"
                  role="menuitem"
                  onClick={() => router.push(item.path)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs uppercase tracking-widest">
                    {item.label}
                  </span>
                </Button>
              )
            })}
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
