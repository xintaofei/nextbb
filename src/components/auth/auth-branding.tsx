"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"

export function AuthBranding() {
  const t = useTranslations("Auth.Login")

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-border/40 relative overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Wave Background - 波浪背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layer 1 - Slow */}
        <div
          className="absolute bottom-0 left-0 w-[200%] h-[45%] flex animate-wave-slow opacity-10 text-muted-foreground"
          style={{ animationDelay: "0s" }}
        >
          <svg
            className="w-1/2 h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,80 C240,110 480,110 720,80 C960,50 1200,50 1440,80 V320 H0 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-full -ml-px"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,80 C240,110 480,110 720,80 C960,50 1200,50 1440,80 V320 H0 Z"
            />
          </svg>
        </div>

        {/* Layer 2 - Medium */}
        <div
          className="absolute bottom-0 left-0 w-[200%] h-[50%] flex animate-wave-medium opacity-10 text-muted-foreground"
          style={{ animationDelay: "-5s" }}
        >
          <svg
            className="w-1/2 h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,100 C360,100 360,160 720,130 S1080,100 1440,100 V320 H0 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-ful -ml-px"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,100 C360,100 360,160 720,130 S1080,100 1440,100 V320 H0 Z"
            />
          </svg>
        </div>

        {/* Layer 3 - Fast */}
        <div
          className="absolute bottom-0 left-0 w-[200%] h-[40%] flex animate-wave-fast opacity-10 text-muted-foreground"
          style={{ animationDelay: "-2s" }}
        >
          <svg
            className="w-1/2 h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,60 C240,85 480,85 720,60 C960,35 1200,35 1440,60 V320 H0 Z"
            />
          </svg>
          <svg
            className="w-1/2 h-full -ml-px"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,60 C240,85 480,85 720,60 C960,35 1200,35 1440,60 V320 H0 Z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-8 animate-fadeIn relative z-10">
        <div className="flex items-center">
          <div className="relative w-32 h-32">
            <Image
              src="/nextbb-logo.png"
              alt="NextBB"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-8 max-w-md">
          <h1 className="font-serif text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
            {t("Branding.titlePart1")}{" "}
            <span className="text-primary relative inline-block">
              {t("Branding.titlePart2")}
              <div className="absolute -bottom-4 left-0 right-0 h-1 bg-primary/20" />
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("Branding.description")}
          </p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground relative z-10">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {t("Branding.fastTitle")}
            </div>
            <div>{t("Branding.fastDesc")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {t("Branding.secureTitle")}
            </div>
            <div>{t("Branding.secureDesc")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {t("Branding.modernTitle")}
            </div>
            <div>{t("Branding.modernDesc")}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
