"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import useSWR from "swr"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type SocialProvider = {
  providerKey: string
  name: string
  icon: string | null
  sort: number
}

type ProvidersResponse = {
  providers: SocialProvider[]
}

interface OAuthButtonsProps {
  callbackUrl: string
}

const fetcher = async (url: string): Promise<ProvidersResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("获取社交登录提供商失败")
  }
  return res.json()
}

const builtInIcons: Record<string, React.ReactNode> = {
  github: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  linuxdo: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <defs>
        <clipPath id="linuxdo-clip">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#linuxdo-clip)">
        <rect width="24" height="8" fill="#000000" />
        <rect y="8" width="24" height="8" fill="#FFFFFF" />
        <rect y="16" width="24" height="8" fill="#FFB000" />
      </g>
    </svg>
  ),
}

function ProviderIcon({
  provider,
}: {
  provider: SocialProvider
}): React.ReactNode {
  if (builtInIcons[provider.providerKey]) {
    return builtInIcons[provider.providerKey]
  }

  if (provider.icon) {
    if (provider.icon.startsWith("<svg") || provider.icon.startsWith("<SVG")) {
      return (
        <span
          className="w-5 h-5 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: provider.icon }}
        />
      )
    }
    return (
      <Image
        src={provider.icon}
        alt={provider.name}
        width={20}
        height={20}
        className="w-5 h-5 object-contain"
        unoptimized
      />
    )
  }

  return (
    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
      {provider.name.charAt(0).toUpperCase()}
    </div>
  )
}

export function OAuthButtons({ callbackUrl }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const { data, isLoading } = useSWR<ProvidersResponse>(
    "/api/social-providers",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  )

  const handleSignIn = async (providerKey: string) => {
    try {
      setLoadingProvider(providerKey)
      await signIn(providerKey, {
        callbackUrl,
      })
    } catch (error) {
      console.error("OAuth login error:", error)
      setLoadingProvider(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-11 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    )
  }

  const providers = data?.providers ?? []

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Button
          key={provider.providerKey}
          variant="outline"
          className="w-full h-11 gap-3 font-medium"
          onClick={() => handleSignIn(provider.providerKey)}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === provider.providerKey ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ProviderIcon provider={provider} />
          )}
          <span>{provider.name}</span>
        </Button>
      ))}
    </div>
  )
}
