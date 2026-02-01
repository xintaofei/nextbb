"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  Edit,
  Trash2,
  Globe,
  Plus,
  Folder,
  Power,
  PowerOff,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ExpressionGroup, Expression } from "@/types/expression"

type ExpressionGroupListItemProps = {
  group: Pick<
    ExpressionGroup,
    | "id"
    | "code"
    | "name"
    | "iconId"
    | "sort"
    | "isEnabled"
    | "isDeleted"
    | "expressionCount"
  >
  expressions?: Pick<Expression, "id" | "imageUrl" | "textContent" | "type">[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
  onManageTranslations: (id: string) => void
  onAddExpression: (groupId: string) => void
  children: React.ReactNode
  sortableId: string
  disabled?: boolean
}

export function ExpressionGroupContent({
  group,
  expressions = [],
  onEdit,
  onDelete,
  onToggleEnabled,
  onManageTranslations,
  onAddExpression,
  children,
  attributes,
  listeners,
  setNodeRef,
  style,
  isDragging,
  disabled,
}: ExpressionGroupListItemProps & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: any
  setNodeRef?: (node: HTMLElement | null) => void
  style?: React.CSSProperties
  isDragging?: boolean
}) {
  const t = useTranslations("AdminExpressions")
  const tAdmin = useTranslations("Admin")
  const [isOpen, setIsOpen] = useState(true)

  // 根据 iconId 查找对应的表情
  const iconExpression = group.iconId
    ? expressions.find((e) => e.id === group.iconId)
    : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={false}
        animate={
          isDragging
            ? { scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" }
            : { scale: 1, boxShadow: "none" }
        }
        className={cn(
          "rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden",
          isDragging && "z-50 border-primary/50"
        )}
      >
        {/* Group Header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      !isOpen && "-rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>

              {iconExpression ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 shrink-0">
                  {iconExpression.type === "IMAGE" &&
                  iconExpression.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconExpression.imageUrl}
                      alt={group.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : iconExpression.type === "TEXT" &&
                    iconExpression.textContent ? (
                    <span className="text-xl">
                      {iconExpression.textContent}
                    </span>
                  ) : (
                    <Folder className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-muted/30 shrink-0">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base leading-tight">
                    {group.name}
                  </h3>
                  <code className="text-xs text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                    {group.code}
                  </code>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {t("group.expressionCount")}: {group.expressionCount}
                  </Badge>
                  {group.isDeleted && (
                    <Badge variant="destructive" className="text-xs">
                      {t("filter.deleted.deleted")}
                    </Badge>
                  )}
                  {!group.isEnabled && !group.isDeleted && (
                    <Badge variant="secondary" className="text-xs">
                      {t("group.disabled")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddExpression(group.id)}
                className="h-8 text-xs"
                disabled={group.isDeleted}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t("createExpressionButton")}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToggleEnabled(group.id, !group.isEnabled)}
                className="h-8 w-8"
                title={group.isEnabled ? t("group.disable") : t("group.enable")}
                disabled={group.isDeleted}
              >
                {group.isEnabled ? (
                  <Power className="h-4 w-4 text-green-500" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onManageTranslations(group.id)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                title={tAdmin("translationDialog.title")}
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(group.id)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(group.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expression Grid */}
        <CollapsibleContent>
          <div className="p-4 bg-muted/20">{children}</div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  )
}

export function ExpressionGroupListItem(props: ExpressionGroupListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.sortableId, disabled: props.disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <ExpressionGroupContent
      {...props}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
    />
  )
}
