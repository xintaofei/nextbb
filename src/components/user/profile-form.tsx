"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type UserData = {
  id: bigint
  bio: string
  website: string
  location: string
  birthday: Date | null
}

type ProfileFormProps = {
  user: UserData
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("User.preferences.profile")
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
      const response = await fetch("/api/users/me/profile", {
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
        throw new Error(t("saveError"))
      }

      toast.success(t("saveSuccess"))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"))
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
      <div className="space-y-4">
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
          <p className="flex flex-row justify-between text-sm text-muted-foreground">
            <span>{t("bioHelper")}</span>
            <span>{formData.bio.length}/500</span>
          </p>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="location">{t("location")}</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder={t("locationPlaceholder")}
          />
        </div>

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

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  )
}
