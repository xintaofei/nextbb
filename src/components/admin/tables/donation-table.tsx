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
import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/common/relative-time"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, CheckCircle, Trash2 } from "lucide-react"
import { useState } from "react"
import type { DonationSource, DonationStatus } from "@prisma/client"

export interface DonationListItem {
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

interface DonationTableProps {
  donations: DonationListItem[]
  onEdit: (donation: DonationListItem) => void
  onConfirm: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const STATUS_STYLES: Record<DonationStatus, string> = {
  PENDING:
    "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40",
  CONFIRMED:
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  FAILED: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40",
  REFUNDED:
    "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40",
  CANCELLED:
    "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/40",
}

export function DonationTable({
  donations,
  onEdit,
  onConfirm,
  onDelete,
}: DonationTableProps) {
  const t = useTranslations("AdminDonations")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleConfirmClick = (id: string) => {
    setSelectedId(id)
    setConfirmDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setSelectedId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    if (selectedId) {
      await onConfirm(selectedId)
    }
    setConfirmDialogOpen(false)
    setSelectedId(null)
  }

  const handleDeleteAction = async () => {
    if (selectedId) {
      await onDelete(selectedId)
    }
    setDeleteDialogOpen(false)
    setSelectedId(null)
  }

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    const symbols: Record<string, string> = {
      CNY: "¥",
      USD: "$",
      EUR: "€",
      GBP: "£",
    }
    const symbol = symbols[currency] || currency
    return `${symbol}${num.toLocaleString()}`
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-40">{t("table.donor")}</TableHead>
              <TableHead className="w-28">{t("table.amount")}</TableHead>
              <TableHead className="w-28">{t("table.source")}</TableHead>
              <TableHead className="w-24">{t("table.status")}</TableHead>
              <TableHead className="max-w-xs">{t("table.message")}</TableHead>
              <TableHead className="w-36">{t("table.createdAt")}</TableHead>
              <TableHead className="w-20 text-right">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-foreground/60"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              donations.map((donation) => (
                <TableRow
                  key={donation.id}
                  className="group hover:bg-foreground/5 transition-colors border-border/40"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {donation.isAnonymous
                          ? t("anonymous")
                          : donation.donorName || donation.userName || "-"}
                      </span>
                      {donation.donorEmail && !donation.isAnonymous && (
                        <span className="text-xs text-foreground/50 truncate max-w-[140px]">
                          {donation.donorEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(donation.amount, donation.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded-full border border-border/40">
                      {t(`source.${donation.source}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${STATUS_STYLES[donation.status]} text-[10px]`}
                    >
                      {t(`status.${donation.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {donation.message ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-foreground/60 truncate cursor-help block max-w-[200px]">
                              {donation.message}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {donation.message}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-foreground/40">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground/40">
                      <RelativeTime date={donation.createdAt} />
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(donation)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        {donation.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => handleConfirmClick(donation.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t("actions.confirm")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(donation.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.confirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {t("actions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("actions.deleteMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
