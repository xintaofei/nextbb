"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload } from "lucide-react"

type UserData = {
  id: bigint
  name: string
  email: string
  avatar: string
  bio: string
  website: string
  location: string
  birthday: Date | null
}

type AccountFormProps = {
  user: UserData
}

export function AccountForm({ user }: AccountFormProps) {
  const t = useTranslations("User.preferences.account")
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    bio: user.bio,
    website: user.website,
    location: user.location,
    birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/users/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          birthday: formData.birthday || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      toast.success(t("saveSuccess"))
      router.refresh()
    } catch (error) {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>

        {/* 头像 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label>{t("avatar")}</Label>
            <p className="text-sm text-muted-foreground">{t("uploadAvatar")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("uploadAvatar")}
            </Button>
          </div>
        </div>

        {/* 用户名 */}
        <div className="space-y-2">
          <Label htmlFor="username">{t("username")}</Label>
          <Input id="username" value={user.name} disabled />
          <p className="text-sm text-muted-foreground">{t("usernameHelper")}</p>
        </div>

        {/* 邮箱 */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" value={user.email} disabled />
          <p className="text-sm text-muted-foreground">{t("emailHelper")}</p>
        </div>

        {/* 个人简介 */}
        <div className="space-y-2">
          <Label htmlFor="bio">{t("bio")}</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            placeholder={t("bioPlaceholder")}
            rows={4}
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground text-right">
            {formData.bio.length}/500
          </p>
        </div>

        {/* 个人网站 */}
        <div className="space-y-2">
          <Label htmlFor="website">{t("website")}</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            placeholder={t("websitePlaceholder")}
          />
        </div>

        {/* 所在地 */}
        <div className="space-y-2">
          <Label htmlFor="location">{t("location")}</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder={t("locationPlaceholder")}
          />
        </div>

        {/* 生日 */}
        <div className="space-y-2">
          <Label htmlFor="birthday">{t("birthday")}</Label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) => handleInputChange("birthday", e.target.value)}
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  )
}
