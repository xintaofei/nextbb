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
  Workflow,
  Languages,
  Bot,
  ChevronDown,
  Heart,
  Link2,
  Smile,
  Blocks,
  HardDrive,
  ClipboardCheck,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfig } from "@/components/providers/config-provider"

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("Admin.nav")
  const { configs } = useConfig()

  const siteName = configs?.["basic.name"] || "NextBB"

  const isPathActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin"
    }
    return pathname?.startsWith(path)
  }

  const navItems = [
    { label: t("overview"), icon: BarChart3, path: "/admin" },
    { label: t("topics"), icon: FileText, path: "/admin/topics" },
    {
      label: t("userManagement"),
      icon: Users,
      items: [
        { label: t("users"), icon: Users, path: "/admin/users" },
        {
          label: t("registrationApplications"),
          icon: ClipboardCheck,
          path: "/admin/registration-applications",
        },
      ],
    },
    {
      label: t("contentStructure"),
      icon: Folder,
      items: [
        { label: t("categories"), icon: Folder, path: "/admin/categories" },
        { label: t("tags"), icon: Tag, path: "/admin/tags" },
        { label: t("badges"), icon: Award, path: "/admin/badges" },
      ],
    },
    {
      label: t("intelligence"),
      icon: Bot,
      items: [
        {
          label: t("llmConfigs"),
          icon: Bot,
          path: "/admin/llm-configs",
        },
        {
          label: t("translationTasks"),
          icon: Languages,
          path: "/admin/translation-tasks",
        },
        {
          label: t("automationRules"),
          icon: Workflow,
          path: "/admin/automation-rules",
        },
      ],
    },
    {
      label: t("extensions"),
      icon: Blocks,
      items: [
        {
          label: t("socialProviders"),
          icon: Link2,
          path: "/admin/social-providers",
        },
        {
          label: t("storageProviders"),
          icon: HardDrive,
          path: "/admin/storage-providers",
        },
        {
          label: t("expressions"),
          icon: Smile,
          path: "/admin/expressions",
        },
        { label: t("donations"), icon: Heart, path: "/admin/donations" },
      ],
    },
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
            {siteName}
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
            className="hidden md:flex gap-4"
            role="menubar"
            aria-label="Navigation tabs"
          >
            {navItems.map((item) => {
              const Icon = item.icon

              if (item.items) {
                const isActive = item.items.some((subItem) =>
                  isPathActive(subItem.path)
                )

                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger
                      className={cn(
                        "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all h-8 uppercase tracking-widest outline-none",
                        isActive
                          ? "text-foreground bg-background/50"
                          : "text-foreground/70 hover:text-foreground hover:bg-background/50 focus:bg-background/50"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = isPathActive(subItem.path)
                        return (
                          <DropdownMenuItem
                            key={subItem.path}
                            asChild
                            className={cn(
                              "mb-1 last:mb-0",
                              isSubActive &&
                                "bg-primary/10 text-primary font-semibold focus:bg-primary/10 focus:text-primary"
                            )}
                          >
                            <Link
                              href={subItem.path}
                              className="w-full cursor-pointer"
                            >
                              <SubIcon
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{subItem.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              const isActive = isPathActive(item.path!)

              return (
                <Link
                  key={item.label}
                  href={item.path!}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all h-8 uppercase tracking-widest",
                    isActive
                      ? "text-foreground bg-background/50"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                  )}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
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

              if (item.items) {
                const isParentActive = item.items.some((subItem) =>
                  isPathActive(subItem.path)
                )

                return (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div
                      className={cn(
                        "inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all h-8 px-3 uppercase tracking-widest",
                        isParentActive
                          ? "text-foreground"
                          : "text-foreground/70"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <div className="pl-6 flex flex-col gap-1 border-l ml-4 border-border/40">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = isPathActive(subItem.path)
                        return (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            className={cn(
                              "inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all h-8 px-3 uppercase tracking-widest mb-1 last:mb-0",
                              isSubActive
                                ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                                : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                            )}
                            role="menuitem"
                          >
                            <SubIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{subItem.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const isActive = isPathActive(item.path!)

              return (
                <Link
                  key={item.label}
                  href={item.path!}
                  className={cn(
                    "inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all h-8 px-3 uppercase tracking-widest",
                    isActive
                      ? "text-foreground bg-background/50"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                  )}
                  role="menuitem"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
