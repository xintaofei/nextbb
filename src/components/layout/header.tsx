import { Label } from "@/components/ui/label"
import { Fragment, ReactNode } from "react"
import { Link } from "@/i18n/navigation"

export interface Breadcrumb {
  description: string
  url?: string
}

interface HeaderProps {
  title: string
  breadcrumbs: Breadcrumb[]
  children?: ReactNode
}

export function Header({ title, breadcrumbs, ...props }: HeaderProps) {
  return (
    <div className="flex flex-col shrink-0 p-8 gap-4">
      <div className="flex flex-row justify-between items-center h-10">
        <Label className="text-2xl font-bold">{title}</Label>
        <div className="flex flex-row gap-2">
          {props.children && props.children}
        </div>
      </div>
      <div className="flex flex-row gap-2 items-center">
        {breadcrumbs.map((bc, index) => {
          const baseClass = "h-full"
          const lastItemClass =
            index === breadcrumbs.length - 1 ? " text-muted-foreground" : ""
          const label = bc.url ? (
            <Link href={bc.url}>
              <Label
                className={`cursor-pointer ${baseClass + lastItemClass} hover:underline`}
              >
                {bc.description}
              </Label>
            </Link>
          ) : (
            <Label className={`${baseClass + lastItemClass}`}>
              {bc.description}
            </Label>
          )
          const separator =
            index < breadcrumbs.length - 1 ? (
              <span
                key={`breadcrumb-sep-${index}`}
                className="w-1 h-1 rounded-[50%] bg-muted-foreground"
              ></span>
            ) : null

          return (
            <Fragment key={`layout-title-${index}`}>
              {label}
              {separator}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
