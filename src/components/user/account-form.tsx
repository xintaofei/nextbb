"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { encodeUsername } from "@/lib/utils"

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
  const pathname = usePathname()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    username: user.name,
    bio: user.bio,
    website: user.website,
    location: user.location,
    birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 如果用户名验证失败，不提交
    if (usernameError) {
      toast.error(usernameError)
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/users/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:
            formData.username !== user.name ? formData.username : undefined,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          birthday: formData.birthday || null,
        }),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(t("usernameTaken"))
        }
        throw new Error("Failed to save")
      }

      toast.success(t("saveSuccess"))

      // 如果用户名发生了改变，需要跳转到新的用户名URL
      const usernameChanged = formData.username !== user.name
      if (usernameChanged && pathname) {
        // 将路径中的旧用户名替换为新用户名
        const encodedNewUsername = encodeUsername(formData.username)
        const encodedOldUsername = encodeUsername(user.name)
        const newPath = pathname.replace(
          `/u/${encodedOldUsername}`,
          `/u/${encodedNewUsername}`
        )
        router.push(newPath)
      } else {
        router.refresh()
      }
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

    // 如果是用户名字段，清除错误
    if (field === "username") {
      setUsernameError(null)
    }
  }

  const validateUsername = (username: string): string | null => {
    // 长度验证
    if (username.length < 2 || username.length > 32) {
      return t("usernameInvalid")
    }

    // 基本字符验证
    const basicRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/
    if (!basicRegex.test(username)) {
      return t("usernameInvalid")
    }

    // 危险字符验证
    const dangerousChars = /[\/\\?#@%&=+\s.,:;'"<>{}\[\]|`~!$^*()]/
    if (dangerousChars.test(username)) {
      return t("usernameInvalid")
    }

    // 连字符验证
    if (username.startsWith("-") || username.endsWith("-")) {
      return t("usernameInvalid")
    }

    // 连续连字符验证
    if (/--/.test(username)) {
      return t("usernameInvalid")
    }

    return null
  }

  const handleUsernameBlur = async () => {
    const username = formData.username.trim()

    // 如果用户名没有变化，不需要验证
    if (username === user.name) {
      setUsernameError(null)
      return
    }

    // 先进行格式验证
    const validationError = validateUsername(username)
    if (validationError) {
      setUsernameError(validationError)
      return
    }

    // 检查用户名是否已被使用
    setCheckingUsername(true)
    try {
      const response = await fetch("/api/users/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
        }),
      })

      if (!response.ok) {
        setUsernameError(t("usernameCheckError"))
        return
      }

      const data = await response.json()
      if (!data.available) {
        setUsernameError(t("usernameTaken"))
      } else {
        setUsernameError(null)
      }
    } catch {
      setUsernameError(t("usernameCheckError"))
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("invalidFileType"))
      return
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(t("fileTooLarge"))
      return
    }

    // 创建预览
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 上传文件
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setAvatarPreview(data.avatar)
      toast.success(t("uploadSuccess"))
      router.refresh()
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast.error(t("uploadError"))
      // 恢复原始头像
      setAvatarPreview(user.avatar)
    } finally {
      setUploading(false)
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>

        {/* 头像 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label>{t("avatar")}</Label>
            <p className="text-sm text-muted-foreground mb-2">
              {t("uploadAvatar")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? t("uploading") : t("uploadAvatar")}
            </Button>
          </div>
        </div>

        {/* 用户名 */}
        <div className="space-y-2">
          <Label htmlFor="username">{t("username")}</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            onBlur={handleUsernameBlur}
            disabled={checkingUsername}
          />
          {checkingUsername ? (
            <p className="text-sm text-muted-foreground">
              {t("usernameChecking")}
            </p>
          ) : usernameError ? (
            <p className="text-sm text-destructive">{usernameError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("usernameHelper")}
            </p>
          )}
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
