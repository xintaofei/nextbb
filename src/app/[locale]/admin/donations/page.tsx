"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import {
  Search,
  Filter,
  Plus,
  Heart,
  CheckCircle2,
  Clock,
  DollarSign,
  Check,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DonationTable } from "@/components/admin/tables/donation-table"
import { DonationDialog } from "@/components/admin/dialogs/donation-dialog"
import type { DonationSource, DonationStatus } from "@prisma/client"

type DonationListItem = {
  id: string
  userId: string | null
  userName: string | null
  donorName: string | null
  donorEmail: string | null
  amount: string
  currency: string
  source: DonationSource
  status: DonationStatus
  externalId: string | null
  isAnonymous: boolean
  message: string | null
  adminNote: string | null
  confirmedBy: string | null
  confirmedAt: string | null
  createdAt: string
}

type DonationListResult = {
  items: DonationListItem[]
  page: number
  pageSize: number
  total: number
  stats: {
    total: number
    totalAmount: string
    confirmed: number
    pending: number
  }
}

type UserListItem = {
  id: string
  name: string
  email: string
  avatar: string
}

type UserListResult = {
  items: UserListItem[]
  total: number
}

const fetcher = async (url: string): Promise<DonationListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

const userFetcher = async (url: string): Promise<UserListResult> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

const SOURCES: DonationSource[] = [
  "KOFI",
  "PATREON",
  "PAYPAL",
  "ALIPAY",
  "WECHAT_PAY",
  "BANK_TRANSFER",
  "CRYPTO",
  "OTHER",
]

const STATUSES: DonationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]

type DonorTypeFilter = "all" | "guest" | "registered"

export default function AdminDonationsPage() {
  const t = useTranslations("AdminDonations")
  const [donorType, setDonorType] = useState<DonorTypeFilter>("all")
  const [donorName, setDonorName] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [source, setSource] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDonation, setEditingDonation] =
    useState<DonationListItem | null>(null)

  const userSearchUrl = useMemo(() => {
    if (donorType !== "registered" || userSearchQuery.length < 1) {
      return null
    }
    return `/api/admin/users?q=${encodeURIComponent(userSearchQuery)}&pageSize=10`
  }, [donorType, userSearchQuery])

  const { data: userSearchResult } = useSWR<UserListResult>(
    userSearchUrl,
    userFetcher
  )

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (donorType !== "all") {
      params.set("donor_type", donorType)
      if (donorType === "guest" && donorName.trim().length > 0) {
        params.set("donor_name", donorName.trim())
      }
      if (donorType === "registered" && selectedUserId) {
        params.set("user_id", selectedUserId)
      }
    }
    if (status) params.set("status", status)
    if (source) params.set("source", source)
    return `/api/admin/donations?${params.toString()}`
  }, [donorType, donorName, selectedUserId, status, source, page])

  const { data, isLoading, mutate } = useSWR<DonationListResult>(query, fetcher)

  const stats = useMemo(() => {
    if (!data?.stats) {
      return { total: 0, totalAmount: "0", confirmed: 0, pending: 0 }
    }
    return data.stats
  }, [data])

  const handleDonorTypeChange = (value: DonorTypeFilter) => {
    setDonorType(value)
    setDonorName("")
    setSelectedUserId(null)
    setSelectedUserName(null)
    setUserSearchQuery("")
    setShowUserDropdown(false)
    setPage(1)
  }

  const handleSelectUser = (user: UserListItem) => {
    setSelectedUserId(user.id)
    setSelectedUserName(user.name)
    setUserSearchQuery("")
    setShowUserDropdown(false)
    setPage(1)
  }

  const handleClearUser = () => {
    setSelectedUserId(null)
    setSelectedUserName(null)
    setUserSearchQuery("")
    setPage(1)
  }

  const handleCreate = () => {
    setEditingDonation(null)
    setDialogOpen(true)
  }

  const handleEdit = (donation: DonationListItem) => {
    setEditingDonation(donation)
    setDialogOpen(true)
  }

  const handleConfirm = async (id: string) => {
    const res = await fetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    })
    if (res.ok) {
      await mutate()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/donations/${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      await mutate()
    }
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingDonation(null)
    mutate()
  }

  const statsItems = [
    {
      key: "total",
      value: stats.total.toLocaleString(),
      icon: Heart,
      iconColor: "text-primary",
    },
    {
      key: "totalAmount",
      value: `¥${parseFloat(stats.totalAmount).toLocaleString()}`,
      icon: DollarSign,
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "confirmed",
      value: stats.confirmed.toLocaleString(),
      icon: CheckCircle2,
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "pending",
      value: stats.pending.toLocaleString(),
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <AdminPageContainer>
      <AdminPageSection delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {t("description")}
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createButton")}
          </Button>
        </div>
      </AdminPageSection>

      <StatsMetricGrid>
        {statsItems.map((stat) => (
          <StatsMetricCard
            key={stat.key}
            label={t(`stats.${stat.key}`)}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </StatsMetricGrid>

      <AdminPageSection
        delay={0.2}
        className="group relative rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur z-10"
      >
        <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-foreground/60" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
              {t("filter.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              value={donorType}
              onValueChange={(v) => handleDonorTypeChange(v as DonorTypeFilter)}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.donorType.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.donorType.all")}</SelectItem>
                <SelectItem value="guest">
                  {t("filter.donorType.guest")}
                </SelectItem>
                <SelectItem value="registered">
                  {t("filter.donorType.registered")}
                </SelectItem>
              </SelectContent>
            </Select>

            {donorType === "guest" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder={t("filter.donorNamePlaceholder")}
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 bg-background/60 border-border/40 focus:border-border/60"
                />
              </div>
            )}

            {donorType === "registered" && (
              <div className="relative">
                {selectedUserId ? (
                  <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/50 border-border/40">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      {selectedUserName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUser}
                      className="h-5 w-5 p-0 shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value)
                        setShowUserDropdown(true)
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder={t("filter.userSearchPlaceholder")}
                      className="pl-9 bg-background/60 border-border/40 focus:border-border/60"
                    />
                    {showUserDropdown &&
                      userSearchQuery.length > 0 &&
                      userSearchResult &&
                      userSearchResult.items.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md">
                          <ScrollArea className="max-h-64 overflow-y-scroll">
                            {userSearchResult.items.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                                onClick={() => handleSelectUser(user)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      )}
                    {showUserDropdown &&
                      userSearchQuery.length > 0 &&
                      userSearchResult &&
                      userSearchResult.items.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md p-3 text-center text-sm text-muted-foreground">
                          {t("filter.noUserFound")}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            <Select
              value={status ?? "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? undefined : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.status.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.status.all")}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`filter.status.${s.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={source ?? "all"}
              onValueChange={(value) => {
                setSource(value === "all" ? undefined : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.source.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.source.all")}</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`filter.source.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminPageSection>

      {isLoading ? (
        <div className="text-center py-12 text-foreground/60">
          {t("loading")}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">{t("empty")}</div>
      ) : (
        <AdminPageSection
          delay={0.3}
          className="overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur"
        >
          <DonationTable
            donations={data.items}
            onEdit={handleEdit}
            onConfirm={handleConfirm}
            onDelete={handleDelete}
          />
        </AdminPageSection>
      )}

      <AdminPageSection
        delay={0.4}
        className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur"
      >
        <span className="text-sm text-foreground/60">
          {t("pagination.total", { count: data?.total ?? 0 })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={(data?.page ?? 1) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("pagination.prev")}
          </Button>
          <span className="text-sm min-w-20 text-center">
            {t("pagination.page", { page: data?.page ?? 1 })}
          </span>
          <Button
            variant="ghost"
            disabled={!data ? true : data.page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("pagination.next")}
          </Button>
        </div>
      </AdminPageSection>

      <DonationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        donation={editingDonation}
        onSuccess={handleDialogSuccess}
      />
    </AdminPageContainer>
  )
}
