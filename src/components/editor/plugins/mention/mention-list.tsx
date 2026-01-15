import { useState, forwardRef, useImperativeHandle } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface User {
  id: string
  name: string
  avatar: string | null
}

interface MentionListProps {
  query: string
  onSelect: (user: User) => void
  onClose: () => void
}

export interface MentionListRef {
  onKeyDown: (e: KeyboardEvent) => boolean
}

const EMPTY_USERS: User[] = []

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ query, onSelect, onClose }, ref) => {
    const t = useTranslations("Common")
    const { data: users = EMPTY_USERS, isLoading } = useSWR<User[]>(
      query ? `/api/users/search?q=${encodeURIComponent(query)}` : null,
      (url: string) => fetch(url).then((res) => res.json()),
      { keepPreviousData: true }
    )

    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when users list changes
    const [prevUsers, setPrevUsers] = useState<User[]>(users)
    if (users !== prevUsers) {
      setSelectedIndex(0)
      setPrevUsers(users)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % users.length)
          return true
        }
        if (e.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length)
          return true
        }
        if (e.key === "Enter") {
          if (users.length > 0) {
            onSelect(users[selectedIndex])
            return true
          }
        }
        if (e.key === "Escape") {
          onClose()
          return true
        }
        return false
      },
    }))

    if (!query && !isLoading) return null
    if (users.length === 0 && !isLoading) {
      return (
        <div className="w-64 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden p-1">
          <div className="p-2 text-sm text-muted-foreground">
            {t("Mention.noUsersFound")}
          </div>
        </div>
      )
    }

    return (
      <div
        className="w-56 max-h-96 overflow-y-auto bg-popover text-popover-foreground rounded-md border shadow-md p-1"
        onWheel={(e) => e.stopPropagation()}
      >
        {users.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer select-none",
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => {
              onSelect(user)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-xs font-medium uppercase">
                  {user.name[0]}
                </span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium truncate">{user.name}</span>
            </div>
          </div>
        ))}
        {isLoading && users.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground animate-pulse">
            {t("Loading.loading")}
          </div>
        )}
      </div>
    )
  }
)

MentionList.displayName = "MentionList"
