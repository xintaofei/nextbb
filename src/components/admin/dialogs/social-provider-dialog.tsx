"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
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
}

type SocialProviderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: SocialProviderItem
  onSubmit: (data: SocialProviderFormData) => Promise<void>
}

type PresetProvider = {
  name: string
  icon: string
  scope: string
  authorizeUrl: string
  tokenUrl: string
  userinfoUrl: string
  wellKnownUrl: string
}

const PRESET_PROVIDERS: Record<string, PresetProvider> = {
  google: {
    name: "Google",
    icon: "",
    scope: "openid email profile",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    wellKnownUrl:
      "https://accounts.google.com/.well-known/openid-configuration",
  },
  github: {
    name: "GitHub",
    icon: "",
    scope: "read:user user:email",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userinfoUrl: "https://api.github.com/user",
    wellKnownUrl: "",
  },
  linuxdo: {
    name: "LinuxDo",
    icon: "",
    scope: "openid profile email",
    authorizeUrl: "https://connect.linux.do/oauth2/authorize",
    tokenUrl: "https://connect.linux.do/oauth2/token",
    userinfoUrl: "https://connect.linux.do/api/user",
    wellKnownUrl: "https://connect.linux.do/.well-known/openid-configuration",
  },
  discord: {
    name: "Discord",
    icon: "",
    scope: "identify email",
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userinfoUrl: "https://discord.com/api/users/@me",
    wellKnownUrl: "",
  },
  microsoft: {
    name: "Microsoft",
    icon: "",
    scope: "openid email profile",
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userinfoUrl: "https://graph.microsoft.com/oidc/userinfo",
    wellKnownUrl:
      "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
  },
}

export function SocialProviderDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
}: SocialProviderDialogProps) {
  const t = useTranslations("AdminSocialProviders")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom")
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (provider) {
      setSelectedTemplate("custom")
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
      })
    } else {
      setSelectedTemplate("custom")
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
      })
    }
  }, [provider, open])

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    if (template !== "custom" && PRESET_PROVIDERS[template]) {
      const preset = PRESET_PROVIDERS[template]
      setFormData({
        ...formData,
        providerKey: template,
        name: preset.name,
        icon: preset.icon,
        scope: preset.scope,
        authorizeUrl: preset.authorizeUrl,
        tokenUrl: preset.tokenUrl,
        userinfoUrl: preset.userinfoUrl,
        wellKnownUrl: preset.wellKnownUrl,
      })
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append("file", file)

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formDataObj,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await res.json()
      setFormData({ ...formData, icon: url })
      toast.success(t("dialog.uploadSuccess"))
    } catch {
      toast.error(t("dialog.uploadError"))
    } finally {
      setIsUploading(false)
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

  const isCustomTemplate = selectedTemplate === "custom"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!provider && (
            <div className="space-y-2">
              <Label htmlFor="template">{t("dialog.template")}</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("dialog.templatePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{t("dialog.custom")}</SelectItem>
                  {Object.entries(PRESET_PROVIDERS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerKey">{t("dialog.providerKey")}</Label>
              <Input
                id="providerKey"
                value={formData.providerKey}
                onChange={(e) =>
                  setFormData({ ...formData, providerKey: e.target.value })
                }
                placeholder="google, github, linuxdo..."
                required
                maxLength={32}
                disabled={!!provider || !isCustomTemplate}
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

          <div className="space-y-2">
            <Label>{t("dialog.icon")}</Label>
            <div className="flex items-center gap-4">
              {formData.icon && (
                <div className="relative">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={formData.icon}
                      alt="Provider icon"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                    onClick={() => setFormData({ ...formData, icon: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                      e.target.value = ""
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? t("dialog.uploading") : t("dialog.uploadIcon")}
                </Button>
              </div>
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
