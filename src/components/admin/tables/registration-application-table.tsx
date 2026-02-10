"use client"

import { memo, type ReactElement } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import type { RegistrationApplicationStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export type RegistrationApplicationItem = {
  id: string
  email: string
  username: string
  applicationReason: string
  status: RegistrationApplicationStatus
  reviewReason: string | null
  reviewer: { id: string; name: string } | null
  createdAt: string
  reviewedAt: string | null
  userId: string | null
}

export type RegistrationApplicationTableProps = {
  items: RegistrationApplicationItem[]
  onReview: (
    item: RegistrationApplicationItem,
    action: "approve" | "reject"
  ) => void
  processingId: string | null
}

function RegistrationApplicationTableComponent({
  items,
  onReview,
  processingId,
}: RegistrationApplicationTableProps): ReactElement {
  const t = useTranslations("AdminRegistrationApplications")

  const getStatusLabel = (status: RegistrationApplicationStatus): string => {
    switch (status) {
      case "APPROVED":
        return t("status.approved")
      case "REJECTED":
        return t("status.rejected")
      default:
        return t("status.pending")
    }
  }

  const getStatusVariant = (
    status: RegistrationApplicationStatus
  ): "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "APPROVED":
        return "secondary"
      case "REJECTED":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.applicant")}</TableHead>
          <TableHead>{t("table.reason")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.reviewer")}</TableHead>
          <TableHead>{t("table.reviewReason")}</TableHead>
          <TableHead>{t("table.createdAt")}</TableHead>
          <TableHead>{t("table.reviewedAt")}</TableHead>
          <TableHead>{t("table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isProcessing = processingId === item.id
          return (
            <TableRow key={item.id}>
              <TableCell className="whitespace-normal">
                <div className="font-medium text-foreground">
                  {item.username}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.email}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal max-w-xs text-sm text-foreground/80">
                {item.applicationReason}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-normal text-sm text-foreground/70">
                {item.reviewer?.name ?? "-"}
              </TableCell>
              <TableCell className="whitespace-normal max-w-xs text-sm text-foreground/70">
                {item.reviewReason ?? "-"}
              </TableCell>
              <TableCell className="text-sm text-foreground/70">
                {new Date(item.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm text-foreground/70">
                {item.reviewedAt
                  ? new Date(item.reviewedAt).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell>
                {item.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onReview(item, "approve")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("actions.approve")
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReview(item, "reject")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("actions.reject")
                      )}
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export const RegistrationApplicationTable = memo(
  RegistrationApplicationTableComponent
)
