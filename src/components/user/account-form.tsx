"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Upload, Smile, X, Settings2 } from "lucide-react"
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
  title_badge_id: bigint | null
  custom_status: {
    emoji: string | null
    status_text: string
    expires_at: Date | null
  } | null
  user_badges: {
    badge: {
      id: bigint
      icon: string
      name: string
    }
  }[]
}

type AccountFormProps = {
  user: UserData
}

export function AccountForm({ user }: AccountFormProps) {
  const t = useTranslations("User.preferences.account")
  const router = useRouter()
  const pathname = usePathname()
  const { mutate: mutateMe } = useSWR("/api/auth/me")
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    username: user.name,
    bio: user.bio,
    website: user.website,
    location: user.location,
    birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : "",
    titleBadgeId: user.title_badge_id?.toString() || "none",
    customStatus: {
      emoji: user.custom_status?.emoji || "",
      statusText: user.custom_status?.status_text || "",
      expiresAt:
        user.custom_status?.expires_at &&
        new Date(user.custom_status.expires_at) > new Date()
          ? user.custom_status.expires_at.toISOString()
          : "never",
    },
  })
  const [tempCustomStatus, setTempCustomStatus] = useState({
    emoji: "",
    statusText: "",
    expiresAt: "never" as string,
  })
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  // 只在客户端渲染时间，避免 hydration 错误
  useEffect(() => {
    setMounted(true)
  }, [])

  // 将相对时间转换为具体时间戳
  const getExpiresAtTimestamp = (relativeTime: string): string | null => {
    if (relativeTime === "never") return null
    const now = Date.now()
    switch (relativeTime) {
      case "1hour":
        return new Date(now + 60 * 60 * 1000).toISOString()
      case "4hours":
        return new Date(now + 4 * 60 * 60 * 1000).toISOString()
      case "today":
        return new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
      case "1week":
        return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return null
    }
  }

  // 格式化过期时间（本地时间）
  const formatExpiresAt = (isoString: string): string => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // 常用 emoji 列表
  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😬",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "🥴",
    "🤢",
    "🤮",
    "🤧",
    "😷",
    "🤒",
    "🤕",
    "🤑",
    "🤠",
    "😈",
    "👿",
    "👹",
    "👺",
    "🤡",
    "💩",
    "👻",
    "💀",
    "☠️",
    "👽",
    "👾",
    "🤖",
    "🎃",
    "😺",
    "😸",
    "😹",
    "😻",
    "😼",
    "😽",
    "🙀",
    "😿",
    "😾",
    "💋",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "💅",
    "🤳",
    "💪",
    "🦾",
    "🦿",
    "🦵",
    "🦶",
    "👂",
    "🦻",
    "👃",
    "🧠",
    "🫀",
    "🫁",
    "🦷",
    "🦴",
    "👀",
    "👁️",
    "👅",
    "👄",
    "💔",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🤎",
    "🖤",
    "🤍",
    "💯",
    "💢",
    "💥",
    "💫",
    "💦",
    "💨",
    "🕳️",
    "💬",
    "👁️‍🗨️",
    "🗨️",
    "🗯️",
    "💭",
    "💤",
    "👓",
    "🕶️",
    "🥽",
    "🥼",
    "🦺",
    "👔",
    "👕",
    "👖",
    "🧣",
    "🧤",
    "🧥",
    "🧦",
    "👗",
    "👘",
    "🥻",
    "🩱",
    "🩲",
    "🩳",
    "👙",
    "👚",
    "👛",
    "👜",
    "👝",
    "🎒",
    "👞",
    "👟",
    "🥾",
    "🥿",
    "👠",
    "👡",
    "🩰",
    "👢",
    "👑",
    "👒",
    "🎩",
    "🎓",
    "🧢",
    "⛑️",
    "📿",
    "💄",
    "💍",
    "💎",
    "🔇",
    "🔈",
    "🔉",
    "🔊",
    "📢",
    "📣",
    "📯",
    "🔔",
    "🔕",
    "🎼",
    "🎵",
    "🎶",
    "🎙️",
    "🎚️",
    "🎛️",
    "🎤",
    "🎧",
    "📻",
    "🎷",
    "🎸",
    "🎹",
    "🎺",
    "🎻",
    "🪕",
    "🥁",
    "📱",
    "📲",
    "☎️",
    "📞",
    "📟",
    "📠",
    "🔋",
    "🔌",
    "💻",
    "🖥️",
    "🖨️",
    "⌨️",
    "🖱️",
    "🖲️",
    "💽",
    "💾",
    "💿",
    "📀",
    "🧮",
    "🎥",
    "🎞️",
    "📽️",
    "🎬",
    "📺",
    "📷",
    "📸",
    "📹",
    "📼",
    "🔍",
    "🔎",
    "🕯️",
    "💡",
    "🔦",
    "🏮",
    "🪔",
    "📔",
    "📕",
    "📖",
    "📗",
    "📘",
    "📙",
    "📚",
    "📓",
    "📒",
    "📃",
    "📜",
    "📄",
    "📰",
    "🗞️",
    "📑",
    "🔖",
    "🏷️",
    "💰",
    "💴",
    "💵",
    "💶",
    "💷",
    "💸",
    "💳",
    "🧾",
    "💹",
    "✉️",
    "📧",
    "📨",
    "📩",
    "📤",
    "📥",
    "📦",
    "📫",
    "📪",
    "📬",
    "📭",
    "📮",
    "🗳️",
    "✏️",
    "✒️",
    "🖋️",
    "🖊️",
    "🖌️",
    "🖍️",
    "📝",
    "💼",
    "📁",
    "📂",
    "🗂️",
    "📅",
    "📆",
    "🗒️",
    "🗓️",
    "📇",
    "📈",
    "📉",
    "📊",
    "📋",
    "📌",
    "📍",
    "📎",
    "🖇️",
    "📏",
    "📐",
    "✂️",
    "🗃️",
    "🗄️",
    "🗑️",
    "🔒",
    "🔓",
    "🔏",
    "🔐",
    "🔑",
    "🗝️",
    "🔨",
    "🪓",
    "⛏️",
    "⚒️",
    "🛠️",
    "🗡️",
    "⚔️",
    "🔫",
    "🏹",
    "🛡️",
    "🔧",
    "🔩",
    "⚙️",
    "🗜️",
    "⚖️",
    "🦯",
    "🔗",
    "⛓️",
    "🧰",
    "🧲",
    "⚗️",
    "🧪",
    "🧫",
    "🧬",
    "🔬",
    "🔭",
    "📡",
    "💉",
    "🩸",
    "💊",
    "🩹",
    "🩺",
    "🚪",
    "🛗",
    "🪞",
    "🪟",
    "🛏️",
    "🛋️",
    "🪑",
    "🚽",
    "🚿",
    "🛁",
    "🪒",
    "🧴",
    "🧷",
    "🧹",
    "🧺",
    "🧻",
    "🧼",
    "🧽",
    "🧯",
    "🛒",
    "🚬",
    "⚰️",
    "⚱️",
    "🗿",
    "🏧",
    "🚮",
    "🚰",
    "♿",
    "🚹",
    "🚺",
    "🚻",
    "🚼",
    "🚾",
    "🛂",
    "🛃",
    "🛄",
    "🛅",
    "⚠️",
    "🚸",
    "⛔",
    "🚫",
    "🚳",
    "🚭",
    "🚯",
    "🚱",
    "🚷",
    "📵",
    "🔞",
    "☢️",
    "☣️",
    "⬆️",
    "↗️",
    "➡️",
    "↘️",
    "⬇️",
    "↙️",
    "⬅️",
    "↖️",
    "↕️",
    "↔️",
    "↩️",
    "↪️",
    "⤴️",
    "⤵️",
    "🔃",
    "🔄",
    "🔙",
    "🔚",
    "🔛",
    "🔜",
    "🔝",
    "🛐",
    "⚛️",
    "🕉️",
    "✡️",
    "☸️",
    "☯️",
    "✝️",
    "☦️",
    "☪️",
    "☮️",
    "🕎",
    "🔯",
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
    "⛎",
    "🔀",
    "🔁",
    "🔂",
    "▶️",
    "⏩",
    "⏭️",
    "⏯️",
    "◀️",
    "⏪",
    "⏮️",
    "🔼",
    "⏫",
    "🔽",
    "⏬",
    "⏸️",
    "⏹️",
    "⏺️",
    "⏏️",
    "🎦",
    "🔅",
    "🔆",
    "📶",
    "📳",
    "📴",
    "♀️",
    "♂️",
    "⚕️",
    "♾️",
    "♻️",
    "⚜️",
    "🔱",
    "📛",
    "🔰",
    "⭕",
    "✅",
    "☑️",
    "✔️",
    "✖️",
    "❌",
    "❎",
    "➕",
    "➖",
    "➗",
    "➰",
    "➿",
    "〽️",
    "✳️",
    "✴️",
    "❇️",
    "‼️",
    "⁉️",
    "❓",
    "❔",
    "❕",
    "❗",
    "〰️",
    "©️",
    "®️",
    "™️",
    "#️⃣",
    "*️⃣",
    "0️⃣",
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟",
    "🔠",
    "🔡",
    "🔢",
    "🔣",
    "🔤",
    "🅰️",
    "🆎",
    "🅱️",
    "🆑",
    "🆒",
    "🆓",
    "ℹ️",
    "🆔",
    "Ⓜ️",
    "🆕",
    "🆖",
    "🅾️",
    "🆗",
    "🅿️",
    "🆘",
    "🆙",
    "🆚",
    "🈁",
    "🈂️",
    "🈷️",
    "🈶",
    "🈯",
    "🉐",
    "🈹",
    "🈚",
    "🈲",
    "🉑",
    "🈸",
    "🈴",
    "🈳",
    "㊗️",
    "㊙️",
    "🈺",
    "🈵",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "🟤",
    "⚫",
    "⚪",
    "🟥",
    "🟧",
    "🟨",
    "🟩",
    "🟦",
    "🟪",
    "🟫",
    "⬛",
    "⬜",
    "◼️",
    "◻️",
    "◾",
    "◽",
    "▪️",
    "▫️",
    "🔶",
    "🔷",
    "🔸",
    "🔹",
    "🔺",
    "🔻",
    "💠",
    "🔘",
    "🔳",
    "🔲",
    "🏁",
    "🚩",
    "🎌",
    "🏴",
    "🏳️",
    "🏳️‍🌈",
    "🏳️‍⚧️",
    "🏴‍☠️",
  ]

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
          titleBadgeId:
            formData.titleBadgeId === "none" ? null : formData.titleBadgeId,
          customStatus: formData.customStatus.statusText
            ? {
                emoji: formData.customStatus.emoji || null,
                statusText: formData.customStatus.statusText,
                expiresAt:
                  formData.customStatus.expiresAt === "never"
                    ? null
                    : formData.customStatus.expiresAt,
              }
            : null,
        }),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(t("usernameTaken"))
        }
        throw new Error(t("saveError"))
      }

      toast.success(t("saveSuccess"))

      // 如果用户名发生了改变
      const usernameChanged = formData.username !== user.name
      if (usernameChanged) {
        // 更新 SWR 缓存，让侧边栏等组件能获取到最新的用户名
        await mutateMe()
        if (pathname) {
          // 将路径中的旧用户名替换为新用户名，需要跳转到新的用户名URL
          const encodedNewUsername = encodeUsername(formData.username)
          const encodedOldUsername = encodeUsername(user.name)
          const newPath = pathname.replace(
            `/u/${encodedOldUsername}`,
            `/u/${encodedNewUsername}`
          )
          router.push(newPath)
        }
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenStatusDialog = () => {
    // 打开对话框时，初始化临时状态为当前状态
    setTempCustomStatus({
      emoji: formData.customStatus.emoji,
      statusText: formData.customStatus.statusText,
      expiresAt: formData.customStatus.expiresAt,
    })
    setStatusDialogOpen(true)
  }

  const handleSaveStatus = () => {
    // 保存临时状态到 formData，将相对时间转换为 ISO 字符串
    setFormData((prev) => ({
      ...prev,
      customStatus: {
        emoji: tempCustomStatus.emoji,
        statusText: tempCustomStatus.statusText,
        expiresAt:
          tempCustomStatus.expiresAt === "never"
            ? "never"
            : getExpiresAtTimestamp(tempCustomStatus.expiresAt) || "never",
      },
    }))
    setStatusDialogOpen(false)
  }

  const handleClearStatus = () => {
    // 清除状态
    setTempCustomStatus({
      emoji: "",
      statusText: "",
      expiresAt: "never",
    })
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
        throw new Error(error.error || t("uploadError"))
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

        <div className="space-y-2">
          <Label htmlFor="titleBadge">{t("titleBadge")}</Label>
          <Select
            value={formData.titleBadgeId}
            onValueChange={(value) => handleInputChange("titleBadgeId", value)}
          >
            <SelectTrigger id="titleBadge">
              <SelectValue placeholder={t("titleBadgePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noTitleBadge")}</SelectItem>
              {user.user_badges.map((ub) => {
                const badge = ub.badge
                return (
                  <SelectItem
                    key={badge.id.toString()}
                    value={badge.id.toString()}
                  >
                    <span className="flex items-center gap-2">
                      <span>{badge.icon}</span>
                      <span>{badge.name}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t("titleBadgePlaceholder")}
          </p>
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

        {/* 自定义状态 */}
        <div className="space-y-2">
          <Label>{t("customStatus")}</Label>
          <div className="flex items-center gap-3">
            {/* 设置按钮 */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleOpenStatusDialog}
                  className="shrink-0"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("customStatus")}</DialogTitle>
                  <DialogDescription>
                    {t("customStatusHelper")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Emoji 选择器 */}
                  <div className="space-y-2">
                    <Label>{t("emoji")}</Label>
                    <div className="flex items-center gap-2">
                      <Popover
                        open={emojiPickerOpen}
                        onOpenChange={setEmojiPickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 w-16 text-2xl p-0"
                          >
                            {tempCustomStatus.emoji || (
                              <Smile className="h-5 w-5" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2">
                          <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                            {commonEmojis.map((emoji, index) => (
                              <button
                                key={index}
                                type="button"
                                className="h-10 w-10 text-2xl hover:bg-accent rounded flex items-center justify-center"
                                onClick={() => {
                                  setTempCustomStatus((prev) => ({
                                    ...prev,
                                    emoji,
                                  }))
                                  setEmojiPickerOpen(false)
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {tempCustomStatus.emoji && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setTempCustomStatus((prev) => ({
                              ...prev,
                              emoji: "",
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 状态文本 */}
                  <div className="space-y-2">
                    <Label htmlFor="statusText">{t("statusText")}</Label>
                    <Input
                      id="statusText"
                      value={tempCustomStatus.statusText}
                      onChange={(e) =>
                        setTempCustomStatus((prev) => ({
                          ...prev,
                          statusText: e.target.value,
                        }))
                      }
                      placeholder={t("customStatusPlaceholder")}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {tempCustomStatus.statusText.length}/100
                    </p>
                  </div>

                  {/* 过期时间选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="statusExpiry">{t("statusExpiry")}</Label>
                    <Select
                      value={tempCustomStatus.expiresAt}
                      onValueChange={(value) => {
                        setTempCustomStatus((prev) => ({
                          ...prev,
                          expiresAt: value === "never" ? "never" : value,
                        }))
                      }}
                    >
                      <SelectTrigger id="statusExpiry">
                        <SelectValue
                          placeholder={t("statusExpiryPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">
                          {t("statusExpiryNever")}
                        </SelectItem>
                        <SelectItem value="1hour">
                          {t("statusExpiry1Hour")}
                        </SelectItem>
                        <SelectItem value="4hours">
                          {t("statusExpiry4Hours")}
                        </SelectItem>
                        <SelectItem value="today">
                          {t("statusExpiryToday")}
                        </SelectItem>
                        <SelectItem value="1week">
                          {t("statusExpiry1Week")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearStatus}
                    className="sm:mr-auto"
                  >
                    {t("clearStatus")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatusDialogOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="button" onClick={handleSaveStatus}>
                    {t("saveStatus")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 状态信息展示 */}
            <div className="flex-1 p-2 px-4 border rounded-lg bg-muted/50">
              {formData.customStatus.statusText ? (
                <div className="flex items-center gap-3">
                  {formData.customStatus.emoji && (
                    <span className="text-sm shrink-0">
                      {formData.customStatus.emoji}
                    </span>
                  )}
                  <div className="flex-1 min-w-0 flex flex-row flex-wrap items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {formData.customStatus.statusText}
                    </p>
                    {mounted && formData.customStatus.expiresAt !== "never" && (
                      <p className="text-xs text-muted-foreground">
                        {t("expiresAt")}:{" "}
                        {formatExpiresAt(formData.customStatus.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("notSet")}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("customStatusHelper")}
          </p>
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
