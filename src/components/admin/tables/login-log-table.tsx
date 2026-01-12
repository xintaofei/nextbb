"use client"

import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/common/relative-time"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface LoginLogItem {
  id: string
  user: {
    id: string
    name: string
    avatar: string
  }
  ip: string
  userAgent: string | null
  location: string | null
  status: string
  statusLabel: string
  loginMethod: string
  loginAt: string
}

interface LoginLogTableProps {
  logs: LoginLogItem[]
}

export function LoginLogTable({ logs }: LoginLogTableProps) {
  const t = useTranslations("AdminOverview.logs.logins")

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-48">{t("table.user")}</TableHead>
              <TableHead className="w-32">{t("table.status")}</TableHead>
              <TableHead className="w-32">{t("table.method")}</TableHead>
              <TableHead className="w-40">{t("table.ip")}</TableHead>
              <TableHead className="max-w-xl">{t("table.userAgent")}</TableHead>
              <TableHead className="w-40">{t("table.location")}</TableHead>
              <TableHead className="w-40 text-right">
                {t("table.time")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-foreground/60"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="group hover:bg-foreground/5 transition-colors border-border/40"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 rounded-lg border border-border/40">
                        <AvatarImage src={log.user.avatar} />
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {log.user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground truncate max-w-[120px] block">
                        {log.user.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "SUCCESS" ? "secondary" : "destructive"
                      }
                      className={
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-[10px]"
                          : "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 text-[10px]"
                      }
                    >
                      {log.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded-full border border-border/40">
                      {log.loginMethod}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-foreground/5 px-1.5 py-0.5 rounded text-foreground/70">
                      {log.ip}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-xl overflow-hidden">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-foreground/60 truncate cursor-help italic block">
                            {log.userAgent || "-"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs break-all">
                          {log.userAgent}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground/60 truncate block max-w-[150px]">
                      {log.location || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-foreground/40">
                      <RelativeTime date={log.loginAt} />
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
