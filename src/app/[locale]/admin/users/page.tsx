"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type UserListItem = {
  id: string
  email: string
  name: string
  avatar: string
  isAdmin: boolean
  status: number
  isDeleted: boolean
  createdAt: string
}

type UserListResult = {
  items: UserListItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<UserListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [deleted, setDeleted] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (typeof status === "string") params.set("status", status)
    if (typeof deleted === "string") params.set("deleted", deleted)
    return `/api/admin/users?${params.toString()}`
  }, [q, status, deleted, page])

  const { data, isLoading, mutate } = useSWR<UserListResult>(query, fetcher)

  const onToggleAdmin = async (id: string, next: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: next }),
    })
    if (res.ok) {
      await mutate()
    }
  }

  const onToggleStatus = async (id: string, next: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next ? 1 : 0 }),
    })
    if (res.ok) {
      await mutate()
    }
  }

  const onToggleDeleted = async (id: string, next: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_deleted: next }),
    })
    if (res.ok) {
      await mutate()
    }
  }

  return (
    <div className="relative px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder={t("searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <select
            className="border rounded-md px-2 py-1 h-9"
            value={status ?? ""}
            onChange={(e) => setStatus(e.target.value || undefined)}
          >
            <option value="">{t("filter.status.all")}</option>
            <option value="1">{t("filter.status.active")}</option>
            <option value="0">{t("filter.status.disabled")}</option>
          </select>
          <select
            className="border rounded-md px-2 py-1 h-9"
            value={deleted ?? ""}
            onChange={(e) => setDeleted(e.target.value || undefined)}
          >
            <option value="">{t("filter.deleted.all")}</option>
            <option value="false">{t("filter.deleted.normal")}</option>
            <option value="true">{t("filter.deleted.deleted")}</option>
          </select>
          <Button variant="secondary" onClick={() => setPage(1)}>
            {t("filter.apply")}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.user")}</TableHead>
              <TableHead>{t("table.email")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.deleted")}</TableHead>
              <TableHead>{t("table.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data ? (
              <TableRow>
                <TableCell colSpan={6}>{t("loading")}</TableCell>
              </TableRow>
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>{t("empty")}</TableCell>
              </TableRow>
            ) : (
              data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-2">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <span className="font-medium">{u.name}</span>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {u.isAdmin ? t("role.admin") : t("role.user")}
                      </span>
                      <Switch
                        checked={u.isAdmin}
                        onCheckedChange={(checked) =>
                          onToggleAdmin(u.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {u.status === 1
                          ? t("status.active")
                          : t("status.disabled")}
                      </span>
                      <Switch
                        checked={u.status === 1}
                        onCheckedChange={(checked) =>
                          onToggleStatus(u.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {u.isDeleted
                          ? t("deleted.deleted")
                          : t("deleted.normal")}
                      </span>
                      <Switch
                        checked={u.isDeleted}
                        onCheckedChange={(checked) =>
                          onToggleDeleted(u.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
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
            <span className="text-sm">
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
        </div>
      </div>
    </div>
  )
}
