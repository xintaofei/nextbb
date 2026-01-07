"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AutomationRuleDialog } from "@/components/admin/dialogs/automation-rule-dialog"

type Rule = {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerConditions: unknown
  actionType: string
  actionParams: unknown
  priority: number
  isEnabled: boolean
  isRepeatable: boolean
  maxExecutions: number | null
  cooldownSeconds: number | null
  startTime: string | null
  endTime: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

type RuleListResult = {
  items: Rule[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<RuleListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("failed")
  return res.json()
}

export default function AutomationRulesPage() {
  const t = useTranslations("AdminAutomationRules")

  const [searchQuery, setSearchQuery] = useState("")
  const [triggerType, setTriggerType] = useState("all")
  const [actionType, setActionType] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updatedAt")
  const [page, setPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | undefined>()

  const apiUrl = `/api/admin/automation-rules?page=${page}&pageSize=20&q=${searchQuery}&triggerType=${triggerType}&actionType=${actionType}&sortBy=${sortBy}${
    statusFilter === "enabled"
      ? "&enabled=true&deleted=false"
      : statusFilter === "disabled"
        ? "&enabled=false&deleted=false"
        : statusFilter === "deleted"
          ? "&deleted=true"
          : ""
  }`

  const { data, error, mutate } = useSWR<RuleListResult>(apiUrl, fetcher)

  const handleToggleEnabled = async (
    ruleId: string,
    currentEnabled: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/automation-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      })

      if (!response.ok) throw new Error("Failed to update rule")

      toast.success(
        t(currentEnabled ? "message.disableSuccess" : "message.enableSuccess")
      )
      mutate()
    } catch {
      toast.error(
        t(currentEnabled ? "message.disableError" : "message.enableError")
      )
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm(t("deleteConfirm.description"))) return

    try {
      const response = await fetch(`/api/admin/automation-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }),
      })

      if (!response.ok) throw new Error("Failed to delete rule")

      toast.success(t("message.deleteSuccess"))
      mutate()
    } catch {
      toast.error(t("message.deleteError"))
    }
  }

  const handleCreateRule = async (data: {
    name: string
    description: string
    triggerType: string
    triggerConditions: Record<string, unknown>
    actionType: string
    actionParams: Record<string, unknown>
    priority: number
    isEnabled: boolean
    isRepeatable: boolean
    maxExecutions: number | null
    cooldownSeconds: number | null
    startTime: string | null
    endTime: string | null
  }) => {
    try {
      const response = await fetch("/api/admin/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create rule")
      }

      toast.success(t("message.createSuccess"))
      mutate()
      setCreateDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("message.createError")
      )
      throw error
    }
  }

  const handleEditRule = async (data: {
    name: string
    description: string
    triggerType: string
    triggerConditions: Record<string, unknown>
    actionType: string
    actionParams: Record<string, unknown>
    priority: number
    isEnabled: boolean
    isRepeatable: boolean
    maxExecutions: number | null
    cooldownSeconds: number | null
    startTime: string | null
    endTime: string | null
  }) => {
    if (!editingRule) return

    try {
      const response = await fetch(
        `/api/admin/automation-rules/${editingRule.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update rule")
      }

      toast.success(t("message.updateSuccess"))
      mutate()
      setEditingRule(undefined)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("message.updateError")
      )
      throw error
    }
  }

  const loading = !data && !error
  const rules = data?.items || []
  const total = data?.total || 0

  return (
    <AdminPageContainer>
      <AdminPageSection delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createButton")}
          </Button>
        </div>
      </AdminPageSection>

      <AdminPageSection delay={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.total")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.enabled")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rules.filter((r) => r.isEnabled && !r.isDeleted).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.disabled")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {rules.filter((r) => !r.isEnabled && !r.isDeleted).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.deleted")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {rules.filter((r) => r.isDeleted).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPageSection>

      <AdminPageSection delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>{t("filter.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("filter.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.triggerTypeOptions.all")}
                  </SelectItem>
                  <SelectItem value="CRON">
                    {t("filter.triggerTypeOptions.CRON")}
                  </SelectItem>
                  <SelectItem value="POST_CREATE">
                    {t("filter.triggerTypeOptions.POST_CREATE")}
                  </SelectItem>
                  <SelectItem value="POST_REPLY">
                    {t("filter.triggerTypeOptions.POST_REPLY")}
                  </SelectItem>
                  <SelectItem value="CHECKIN">
                    {t("filter.triggerTypeOptions.CHECKIN")}
                  </SelectItem>
                  <SelectItem value="DONATION">
                    {t("filter.triggerTypeOptions.DONATION")}
                  </SelectItem>
                  <SelectItem value="POST_LIKE">
                    {t("filter.triggerTypeOptions.POST_LIKE")}
                  </SelectItem>
                  <SelectItem value="USER_REGISTER">
                    {t("filter.triggerTypeOptions.USER_REGISTER")}
                  </SelectItem>
                  <SelectItem value="USER_LOGIN">
                    {t("filter.triggerTypeOptions.USER_LOGIN")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.actionTypeOptions.all")}
                  </SelectItem>
                  <SelectItem value="CREDIT_CHANGE">
                    {t("filter.actionTypeOptions.CREDIT_CHANGE")}
                  </SelectItem>
                  <SelectItem value="BADGE_GRANT">
                    {t("filter.actionTypeOptions.BADGE_GRANT")}
                  </SelectItem>
                  <SelectItem value="BADGE_REVOKE">
                    {t("filter.actionTypeOptions.BADGE_REVOKE")}
                  </SelectItem>
                  <SelectItem value="USER_GROUP_CHANGE">
                    {t("filter.actionTypeOptions.USER_GROUP_CHANGE")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.statusOptions.all")}
                  </SelectItem>
                  <SelectItem value="enabled">
                    {t("filter.statusOptions.enabled")}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {t("filter.statusOptions.disabled")}
                  </SelectItem>
                  <SelectItem value="deleted">
                    {t("filter.statusOptions.deleted")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">
                    {t("filter.sortByOptions.updatedAt")}
                  </SelectItem>
                  <SelectItem value="createdAt">
                    {t("filter.sortByOptions.createdAt")}
                  </SelectItem>
                  <SelectItem value="priority">
                    {t("filter.sortByOptions.priority")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </AdminPageSection>

      <AdminPageSection delay={0.3}>
        <div className="space-y-4">
          {loading && <div>{t("loading")}</div>}
          {error && <div className="text-destructive">Error loading rules</div>}
          {!loading && !error && rules.length === 0 && (
            <div className="text-center text-muted-foreground">
              {t("empty")}
            </div>
          )}
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{rule.name}</CardTitle>
                      <Badge
                        variant={
                          rule.isDeleted
                            ? "destructive"
                            : rule.isEnabled
                              ? "default"
                              : "secondary"
                        }
                      >
                        {rule.isDeleted
                          ? t("card.deleted")
                          : rule.isEnabled
                            ? t("card.enabled")
                            : t("card.disabled")}
                      </Badge>
                      <Badge variant="outline">
                        {t("card.priority")}: {rule.priority}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {t(`filter.triggerTypeOptions.${rule.triggerType}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`filter.actionTypeOptions.${rule.actionType}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      {t("card.updatedAt")}:{" "}
                      {new Date(rule.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        {t("card.actions.viewLogs")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        {t("card.actions.edit")}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() =>
                            handleToggleEnabled(rule.id, rule.isEnabled)
                          }
                          disabled={rule.isDeleted}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        disabled={rule.isDeleted}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t("card.actions.delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminPageSection>

      <AdminPageSection delay={0.4}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("pagination.total", { count: total })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t("pagination.prev")}
            </Button>
            <div className="text-sm">{t("pagination.page", { page })}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={rules.length < 20}
            >
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      </AdminPageSection>

      <AutomationRuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateRule}
      />

      <AutomationRuleDialog
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(undefined)}
        rule={editingRule}
        onSubmit={handleEditRule}
      />
    </AdminPageContainer>
  )
}
