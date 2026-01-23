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
import { Switch } from "@/components/ui/switch"
import { SocialProviderItem } from "@/components/admin/cards/social-provider-card"

type SocialProviderFormData = {
  providerKey: string
  name: string
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  userinfoUrl: string
  wellKnownUrl: string
  scope: string
  icon: string
  sort: number
  isEnabled: boolean
}

type SocialProviderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: SocialProviderItem
  onSubmit: (data: SocialProviderFormData) => Promise<void>
}

const PRESET_PROVIDERS: Record<
  string,
  { name: string; icon: string; scope: string }
> = {
  google: { name: "Google", icon: "🔵", scope: "openid email profile" },
  github: { name: "GitHub", icon: "🐙", scope: "read:user user:email" },
  linuxdo: { name: "LinuxDo", icon: "🐧", scope: "openid profile email" },
}

export function SocialProviderDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
}: SocialProviderDialogProps) {
  const t = useTranslations("AdminSocialProviders")
  const [formData, setFormData] = useState<SocialProviderFormData>({
    providerKey: "",
    name: "",
    clientId: "",
    clientSecret: "",
    authorizeUrl: "",
    tokenUrl: "",
    userinfoUrl: "",
    wellKnownUrl: "",
    scope: "",
    icon: "",
    sort: 0,
    isEnabled: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (provider) {
      setFormData({
        providerKey: provider.providerKey,
        name: provider.name,
        clientId: provider.clientId,
        clientSecret: "",
        authorizeUrl: provider.authorizeUrl || "",
        tokenUrl: provider.tokenUrl || "",
        userinfoUrl: provider.userinfoUrl || "",
        wellKnownUrl: provider.wellKnownUrl || "",
        scope: provider.scope || "",
        icon: provider.icon || "",
        sort: provider.sort,
        isEnabled: provider.isEnabled,
      })
    } else {
      setFormData({
        providerKey: "",
        name: "",
        clientId: "",
        clientSecret: "",
        authorizeUrl: "",
        tokenUrl: "",
        userinfoUrl: "",
        wellKnownUrl: "",
        scope: "",
        icon: "",
        sort: 0,
        isEnabled: true,
      })
    }
  }, [provider, open])

  const handleProviderKeyChange = (key: string) => {
    const preset = PRESET_PROVIDERS[key.toLowerCase()]
    if (preset && !provider) {
      setFormData({
        ...formData,
        providerKey: key.toLowerCase(),
        name: preset.name,
        icon: preset.icon,
        scope: preset.scope,
      })
    } else {
      setFormData({ ...formData, providerKey: key })
    }
  }

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerKey">{t("dialog.providerKey")}</Label>
              <Input
                id="providerKey"
                value={formData.providerKey}
                onChange={(e) => handleProviderKeyChange(e.target.value)}
                placeholder="google, github, linuxdo..."
                required
                maxLength={32}
                disabled={!!provider}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Google"
                required
                maxLength={64}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">{t("dialog.icon")}</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="🔵"
                maxLength={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">{t("dialog.sort")}</Label>
              <Input
                id="sort"
                type="number"
                value={formData.sort}
                onChange={(e) =>
                  setFormData({ ...formData, sort: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">{t("dialog.clientId")}</Label>
            <Input
              id="clientId"
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              placeholder="your-client-id"
              required
              maxLength={256}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">{t("dialog.clientSecret")}</Label>
            <Input
              id="clientSecret"
              type="password"
              value={formData.clientSecret}
              onChange={(e) =>
                setFormData({ ...formData, clientSecret: e.target.value })
              }
              placeholder={
                provider ? t("dialog.secretPlaceholder") : "your-client-secret"
              }
              required={!provider}
              maxLength={256}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorizeUrl">{t("dialog.authorizeUrl")}</Label>
            <Input
              id="authorizeUrl"
              value={formData.authorizeUrl}
              onChange={(e) =>
                setFormData({ ...formData, authorizeUrl: e.target.value })
              }
              placeholder="https://.../oauth2/authorize"
              maxLength={512}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenUrl">{t("dialog.tokenUrl")}</Label>
            <Input
              id="tokenUrl"
              value={formData.tokenUrl}
              onChange={(e) =>
                setFormData({ ...formData, tokenUrl: e.target.value })
              }
              placeholder="https://.../oauth2/token"
              maxLength={512}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userinfoUrl">{t("dialog.userinfoUrl")}</Label>
            <Input
              id="userinfoUrl"
              value={formData.userinfoUrl}
              onChange={(e) =>
                setFormData({ ...formData, userinfoUrl: e.target.value })
              }
              placeholder="https://.../oauth2/userinfo"
              maxLength={512}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wellKnownUrl">{t("dialog.wellKnownUrl")}</Label>
            <Input
              id="wellKnownUrl"
              value={formData.wellKnownUrl}
              onChange={(e) =>
                setFormData({ ...formData, wellKnownUrl: e.target.value })
              }
              placeholder="https://.../.well-known/openid-configuration"
              maxLength={512}
            />
            <p className="text-xs text-muted-foreground">
              {t("dialog.wellKnownHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">{t("dialog.scope")}</Label>
            <Input
              id="scope"
              value={formData.scope}
              onChange={(e) =>
                setFormData({ ...formData, scope: e.target.value })
              }
              placeholder="openid email profile"
              maxLength={256}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="isEnabled">{t("dialog.isEnabled")}</Label>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("dialog.submitting") : t("dialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
