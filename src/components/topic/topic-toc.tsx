"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { cn, slugify } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface Heading {
  id: string
  text: string
  level: number
}

interface TopicTocProps {
  contentHtml?: string
  className?: string
}

export function TopicToc({ contentHtml, className }: TopicTocProps) {
  const t = useTranslations("Topic")
  const [activeId, setActiveId] = useState<string>("")
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const headings = useMemo<Heading[]>(() => {
    if (!mounted || !contentHtml) return []

    const parser = new DOMParser()
    const doc = parser.parseFromString(contentHtml, "text/html")
    const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6")

    return Array.from(elements).map((el) => {
      const text = el.textContent || ""
      const id = slugify(text)
      return {
        id,
        text,
        level: parseInt(el.tagName.substring(1)),
      }
    })
  }, [contentHtml, mounted])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0px 0px -80% 0px" }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [headings])

  if (!headings.length) return null

  return (
    <div
      className={cn(
        "hidden lg:flex lg:flex-col sticky top-20 w-full shrink-0 border rounded-lg",
        className,
        "bg-linear-to-b from-muted-foreground/5 to-card"
      )}
    >
      <div className="bg-muted/30 font-bold text-base border-b p-3">
        {t("toc")}
      </div>
      <div className="flex flex-col gap-1 max-h-[calc(100vh-10rem)] overflow-y-auto p-3">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "text-sm hover:text-primary transition-colors line-clamp-1 block py-1",
              activeId === heading.id
                ? "text-primary font-medium"
                : "text-muted-foreground",
              heading.level === 1 && "pl-0 font-bold",
              heading.level === 2 && "pl-3",
              heading.level === 3 && "pl-6",
              heading.level === 4 && "pl-9",
              heading.level >= 5 && "pl-12"
            )}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById(heading.id)
              if (element) {
                const y =
                  element.getBoundingClientRect().top + window.scrollY - 80
                window.scrollTo({ top: y, behavior: "smooth" })
                setActiveId(heading.id)
              }
            }}
          >
            {heading.text}
          </a>
        ))}
      </div>
    </div>
  )
}
