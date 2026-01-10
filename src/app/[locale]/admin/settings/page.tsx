"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { routing } from "@/i18n/routing"
import { LocaleMultiSelect } from "@/components/admin/fields/locale-multi-select"

type ConfigItem = {
  id: string
  configKey: string
  configValue: string
  configType: string
  category: string
  description: string | null
  isPublic: boolean
  isSensitive: boolean
  defaultValue: string
  updatedAt: string
}

type ConfigListResult = {
  items: ConfigItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<ConfigListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function SettingsPage() {
  const t = useTranslations("Admin.settings")
  const tConfig = useTranslations("Config")
  const [activeTab, setActiveTab] = useState("basic")
  const [saving, setSaving] = useState(false)

  const { data, mutate, isLoading } = useSWR<ConfigListResult>(
    "/api/admin/configs?pageSize=100",
    fetcher
  )

  // 按分类组织配置项
  const configsByCategory = useMemo(() => {
    if (!data?.items) return {}
    return data.items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      },
      {} as Record<string, ConfigItem[]>
    )
  }, [data])

  // 表单状态管理
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  // 初始化表单值
  useMemo(() => {
    if (data?.items) {
      const values: Record<string, string> = {}
      data.items.forEach((item) => {
        values[item.configKey] = item.configValue
      })
      setFormValues(values)
    }
  }, [data])

  const handleValueChange = (key: string, value: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: typeof value === "boolean" ? String(value) : value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const configs = Object.entries(formValues).map(([configKey, value]) => ({
        configKey,
        configValue: value,
      }))

      const res = await fetch("/api/admin/configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }

      await mutate()
      toast.success(t("message.saveSuccess"))
    } catch (error) {
      console.error("Save error:", error)
      toast.error(t("message.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (category: string) => {
    const categoryConfigs = configsByCategory[category] || []
    const resetValues = { ...formValues }
    categoryConfigs.forEach((config) => {
      resetValues[config.configKey] = config.defaultValue
    })
    setFormValues(resetValues)
    toast.success(t("message.resetSuccess"))
  }

  const renderConfigInput = (config: ConfigItem) => {
    const value = formValues[config.configKey] ?? config.configValue
    // configKey 现在统一为 2 层结构："category.subkey"
    // 例如: "basic.name", "oauth.github.enabled", "system.pagination.page_size"
    const labelKey = `${config.configKey}.label`
    const descKey = `${config.configKey}.description`

    const label = tConfig(labelKey as never)
    const description = tConfig(descKey as never)

    // 特殊处理：多语言选择器
    if (config.configKey === "system.translation.enabled_locales") {
      let locales: string[] = []
      try {
        locales = JSON.parse(value)
      } catch {
        locales = []
      }

      const getLocaleName = (locale: string) => {
        const localeNames: Record<string, string> = {
          en: "English",
          zh: "中文",
        }
        return localeNames[locale] || locale
      }

      return (
        <div key={config.configKey}>
          <LocaleMultiSelect
            value={locales}
            onChange={(newLocales) =>
              handleValueChange(config.configKey, JSON.stringify(newLocales))
            }
            allLocales={Array.from(routing.locales)}
            getLocaleName={getLocaleName}
            label={label}
            description={description}
            placeholder="选择语言"
          />
        </div>
      )
    }

    switch (config.configType) {
      case "boolean":
        return (
          <div
            key={config.configKey}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="space-y-0.5">
              <Label htmlFor={config.configKey}>{label}</Label>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
            <Switch
              id={config.configKey}
              checked={value === "true"}
              onCheckedChange={(checked) =>
                handleValueChange(config.configKey, checked)
              }
            />
          </div>
        )

      case "number":
        return (
          <div key={config.configKey} className="space-y-2">
            <Label htmlFor={config.configKey}>{label}</Label>
            <Input
              id={config.configKey}
              type="number"
              value={value}
              onChange={(e) =>
                handleValueChange(config.configKey, e.target.value)
              }
            />
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        )

      case "text":
        return (
          <div key={config.configKey} className="space-y-2">
            <Label htmlFor={config.configKey}>{label}</Label>
            <Textarea
              id={config.configKey}
              value={value}
              onChange={(e) =>
                handleValueChange(config.configKey, e.target.value)
              }
              rows={3}
            />
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        )

      default:
        return (
          <div key={config.configKey} className="space-y-2">
            <Label htmlFor={config.configKey}>{label}</Label>
            <Input
              id={config.configKey}
              type={config.isSensitive ? "password" : "text"}
              value={value}
              onChange={(e) =>
                handleValueChange(config.configKey, e.target.value)
              }
            />
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <AdminPageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminPageContainer>
    )
  }

  return (
    <AdminPageContainer>
      <AdminPageSection delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-2">{t("description")}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </AdminPageSection>

      <AdminPageSection delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">{t("basic")}</TabsTrigger>
            <TabsTrigger value="registration">{t("registration")}</TabsTrigger>
            <TabsTrigger value="oauth">{t("oauth")}</TabsTrigger>
            <TabsTrigger value="content">{t("content")}</TabsTrigger>
            <TabsTrigger value="system">{t("system")}</TabsTrigger>
          </TabsList>

          {Object.entries(configsByCategory).map(([category, configs]) => (
            <TabsContent
              key={category}
              value={category}
              className="space-y-6 mt-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {t(category as "basic")}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset(category)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("reset")}
                </Button>
              </div>

              <div className="space-y-4">
                {configs.map((config) => renderConfigInput(config))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </AdminPageSection>
    </AdminPageContainer>
  )
}
