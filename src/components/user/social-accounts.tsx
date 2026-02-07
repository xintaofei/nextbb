"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Link2, Unlink, Loader2 } from "lucide-react"
import { formatLocalTime } from "@/lib/time"
import { cn } from "@/lib/utils"

type SocialProvider = {
  providerKey: string
  name: string
  icon: string | null
}

type LinkedAccount = {
  id: string
  providerKey: string
  providerUsername: string | null
  providerEmail: string | null
  providerAvatar: string | null
  lastUsedAt: string | null
  createdAt: string
}

type SocialAccountsProps = {
  providers: SocialProvider[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SocialAccounts({ providers }: SocialAccountsProps) {
  const t = useTranslations("User.preferences.security.socialAccounts")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState<LinkedAccount | null>(null)

  const { data, mutate, isLoading } = useSWR<{ accounts: LinkedAccount[] }>(
    "/api/users/me/social-accounts",
    fetcher
  )

  const linkedAccounts = data?.accounts ?? []

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")

    if (error === "already_linked") {
      toast.info(t("alreadyLinked"))
      router.replace(window.location.pathname)
    } else if (error === "account_linked_other") {
      toast.error(t("linkedToOther"))
      router.replace(window.location.pathname)
    } else if (success === "linked") {
      toast.success(t("linkSuccess"))
      mutate().then(() => {
        router.replace(window.location.pathname)
      })
    }
  }, [searchParams, t, router, mutate])

  const handleLink = async (providerKey: string) => {
    setLinkingProvider(providerKey)
    try {
      const response = await fetch("/api/users/me/social-accounts/link", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to initiate link")
      }

      await signIn(providerKey, {
        callbackUrl: window.location.href,
      })
    } catch {
      toast.error(t("linkError"))
      setLinkingProvider(null)
    }
  }

  const handleUnlink = async () => {
    if (!confirmUnlink) return

    setUnlinkingId(confirmUnlink.id)
    try {
      const response = await fetch(
        `/api/users/me/social-accounts/${confirmUnlink.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        if (
          data.error ===
          "Cannot unlink the only social account without password"
        ) {
          throw new Error(t("cannotUnlinkLast"))
        }
        throw new Error(t("unlinkError"))
      }

      toast.success(t("unlinkSuccess"))
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unlinkError"))
    } finally {
      setUnlinkingId(null)
      setConfirmUnlink(null)
    }
  }

  const getLinkedAccount = (providerKey: string) => {
    return linkedAccounts.find((a) => a.providerKey === providerKey)
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => {
            const linked = getLinkedAccount(provider.providerKey)
            const isLinking = linkingProvider === provider.providerKey
            const isUnlinking = unlinkingId === linked?.id

            return (
              <div
                key={provider.providerKey}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg",
                  linked && "bg-muted/30"
                )}
              >
                <div className="shrink-0">
                  {provider.icon ? (
                    <Image
                      src={provider.icon}
                      alt={provider.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {linked && (
                      <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {t("linked")}
                      </span>
                    )}
                  </div>

                  {linked ? (
                    <div className="flex items-center gap-2 mt-1">
                      {linked.providerAvatar && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={linked.providerAvatar} />
                          <AvatarFallback className="text-xs">
                            {(linked.providerUsername ?? "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm text-muted-foreground truncate">
                        {linked.providerUsername ?? linked.providerEmail}
                      </span>
                      {linked.lastUsedAt && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          · {t("lastUsed")} {formatLocalTime(linked.lastUsedAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("notLinked")}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmUnlink(linked)}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          {t("unlink")}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(provider.providerKey)}
                      disabled={isLinking}
                    >
                      {isLinking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          {t("link")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog
        open={!!confirmUnlink}
        onOpenChange={(open) => !open && setConfirmUnlink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unlinkConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unlinkConfirmDescription", {
                provider:
                  providers.find(
                    (p) => p.providerKey === confirmUnlink?.providerKey
                  )?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>
              {t("confirmUnlink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
