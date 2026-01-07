"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { CronTriggerConfig } from "./trigger-configs/cron-trigger-config"
import { PostCreateTriggerConfig } from "./trigger-configs/post-create-trigger-config"
import { CheckinTriggerConfig } from "./trigger-configs/checkin-trigger-config"
import { DonationTriggerConfig } from "./trigger-configs/donation-trigger-config"
import { CreditChangeActionConfig } from "./action-configs/credit-change-action-config"
import { BadgeGrantActionConfig } from "./action-configs/badge-grant-action-config"
import { BadgeRevokeActionConfig } from "./action-configs/badge-revoke-action-config"

type RuleFormData = {
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
}

type RuleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: {
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
  }
  onSubmit: (data: RuleFormData) => Promise<void>
}

export function AutomationRuleDialog({
  open,
  onOpenChange,
  rule,
  onSubmit,
}: RuleDialogProps) {
  const t = useTranslations("AdminAutomationRules")
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    triggerType: "POST_CREATE",
    triggerConditions: {},
    actionType: "CREDIT_CHANGE",
    actionParams: {},
    priority: 0,
    isEnabled: true,
    isRepeatable: false,
    maxExecutions: null,
    cooldownSeconds: null,
    startTime: null,
    endTime: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || "",
        triggerType: rule.triggerType,
        triggerConditions:
          (rule.triggerConditions as Record<string, unknown>) || {},
        actionType: rule.actionType,
        actionParams: (rule.actionParams as Record<string, unknown>) || {},
        priority: rule.priority,
        isEnabled: rule.isEnabled,
        isRepeatable: rule.isRepeatable,
        maxExecutions: rule.maxExecutions,
        cooldownSeconds: rule.cooldownSeconds,
        startTime: rule.startTime,
        endTime: rule.endTime,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        triggerType: "POST_CREATE",
        triggerConditions: {},
        actionType: "CREDIT_CHANGE",
        actionParams: {},
        priority: 0,
        isEnabled: true,
        isRepeatable: false,
        maxExecutions: null,
        cooldownSeconds: null,
        startTime: null,
        endTime: null,
      })
    }
  }, [rule, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* 规则名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("dialog.namePlaceholder")}
                required
                maxLength={128}
              />
            </div>

            {/* 规则描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("dialog.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("dialog.descriptionPlaceholder")}
                maxLength={512}
                rows={3}
              />
            </div>

            {/* 触发器类型 */}
            <div className="space-y-2">
              <Label htmlFor="triggerType">{t("dialog.triggerType")}</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    triggerType: value,
                    triggerConditions: {},
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            {/* 触发器配置 */}
            <div className="space-y-2">
              <Label>{t("dialog.triggerConditions")}</Label>
              {formData.triggerType === "CRON" && (
                <CronTriggerConfig
                  value={formData.triggerConditions}
                  onChange={(value) =>
                    setFormData({ ...formData, triggerConditions: value })
                  }
                />
              )}
              {formData.triggerType === "POST_CREATE" && (
                <PostCreateTriggerConfig
                  value={formData.triggerConditions}
                  onChange={(value) =>
                    setFormData({ ...formData, triggerConditions: value })
                  }
                />
              )}
              {formData.triggerType === "CHECKIN" && (
                <CheckinTriggerConfig
                  value={formData.triggerConditions}
                  onChange={(value) =>
                    setFormData({ ...formData, triggerConditions: value })
                  }
                />
              )}
              {formData.triggerType === "DONATION" && (
                <DonationTriggerConfig
                  value={formData.triggerConditions}
                  onChange={(value) =>
                    setFormData({ ...formData, triggerConditions: value })
                  }
                />
              )}
              {(formData.triggerType === "POST_REPLY" ||
                formData.triggerType === "POST_LIKE" ||
                formData.triggerType === "USER_REGISTER" ||
                formData.triggerType === "USER_LOGIN") && (
                <div className="text-sm text-muted-foreground p-4 rounded-lg border bg-muted/50">
                  {t("dialog.noTriggerConfig")}
                </div>
              )}
            </div>

            {/* 执行动作类型 */}
            <div className="space-y-2">
              <Label htmlFor="actionType">{t("dialog.actionType")}</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    actionType: value,
                    actionParams: {},
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

            {/* 动作配置 */}
            <div className="space-y-2">
              <Label>{t("dialog.actionParams")}</Label>
              {formData.actionType === "CREDIT_CHANGE" && (
                <CreditChangeActionConfig
                  value={formData.actionParams}
                  onChange={(value) =>
                    setFormData({ ...formData, actionParams: value })
                  }
                />
              )}
              {formData.actionType === "BADGE_GRANT" && (
                <BadgeGrantActionConfig
                  value={formData.actionParams}
                  onChange={(value) =>
                    setFormData({ ...formData, actionParams: value })
                  }
                />
              )}
              {formData.actionType === "BADGE_REVOKE" && (
                <BadgeRevokeActionConfig
                  value={formData.actionParams}
                  onChange={(value) =>
                    setFormData({ ...formData, actionParams: value })
                  }
                />
              )}
              {formData.actionType === "USER_GROUP_CHANGE" && (
                <div className="text-sm text-muted-foreground p-4 rounded-lg border bg-muted/50">
                  {t("dialog.featureNotImplemented")}
                </div>
              )}
            </div>

            {/* 优先级 */}
            <div className="space-y-2">
              <Label htmlFor="priority">{t("dialog.priority")}</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            {/* 可重复触发开关 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isRepeatable">{t("dialog.isRepeatable")}</Label>
              <Switch
                id="isRepeatable"
                checked={formData.isRepeatable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRepeatable: checked })
                }
              />
            </div>

            {/* 最大执行次数和冷却时间（仅可重复触发时显示） */}
            {formData.isRepeatable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxExecutions">
                    {t("dialog.maxExecutions")}
                  </Label>
                  <Input
                    id="maxExecutions"
                    type="number"
                    value={formData.maxExecutions || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxExecutions: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={t("dialog.maxExecutionsPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldownSeconds">
                    {t("dialog.cooldownSeconds")}
                  </Label>
                  <Input
                    id="cooldownSeconds"
                    type="number"
                    value={formData.cooldownSeconds || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cooldownSeconds: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder={t("dialog.cooldownSecondsPlaceholder")}
                  />
                </div>
              </div>
            )}

            {/* 生效时间范围 */}
            <div className="space-y-2">
              <Label>{t("dialog.timeRangeTitle")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("dialog.timeRangeHint")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t("dialog.startTime")}</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startTime: e.target.value || null,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">{t("dialog.endTime")}</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endTime: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("dialog.submitting") : t("dialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
