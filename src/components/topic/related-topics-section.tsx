import { memo } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { RelativeTime } from "@/components/common/relative-time"
import { RelatedResult } from "@/types/topic"

interface RelatedTopicsSectionProps {
  relatedTopics: RelatedResult["relatedTopics"]
  loading: boolean
}

export const RelatedTopicsSection = memo(function RelatedTopicsSection({
  relatedTopics,
  loading,
}: RelatedTopicsSectionProps) {
  const tc = useTranslations("Common")

  return (
    <div className="flex flex-col gap-4 mt-12">
      <Table className="w-full table-fixed max-sm:table-auto">
        <colgroup>
          <col />
          <col className="w-20 max-sm:hidden" />
          <col className="w-20 max-sm:hidden" />
          <col className="w-20 max-sm:hidden" />
          <col className="w-16 hidden max-sm:table-cell" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="text-2xl">{tc("Table.related")}</TableHead>
            <TableHead className="text-center max-sm:hidden">
              {tc("Table.replies")}
            </TableHead>
            <TableHead className="text-center max-sm:hidden">
              {tc("Table.views")}
            </TableHead>
            <TableHead className="text-center max-sm:hidden">
              {tc("Table.activity")}
            </TableHead>
            <TableHead className="text-right hidden max-sm:table-cell"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <TableRow key={`rt-s-${i}`}>
                  <TableCell className="max-w-full">
                    <Skeleton className="h-7 w-80 max-sm:w-64" />
                    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                      <Skeleton className="h-5 w-24 max-sm:w-20" />
                      <Skeleton className="h-5 w-20 max-sm:w-16" />
                      <Skeleton className="h-5 w-20 max-sm:w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center max-sm:hidden">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center max-sm:hidden">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center max-sm:hidden">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center hidden max-sm:table-cell">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            : relatedTopics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-full">
                    <Link href={`/topic/${t.id}`}>
                      <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal wrap-break-word">
                        {t.title}
                      </span>
                    </Link>
                    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                      <CategoryBadge
                        id={t.category.id}
                        icon={t.category.icon}
                        name={t.category.name}
                        description={t.category.description}
                        bgColor={t.category.bgColor}
                        textColor={t.category.textColor}
                      />
                      {t.tags.map((tag) => (
                        <TagBadge
                          key={tag.id}
                          id={tag.id}
                          icon={tag.icon}
                          name={tag.name}
                          description={tag.description}
                          bgColor={tag.bgColor}
                          textColor={tag.textColor}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground max-sm:hidden">
                    {t.replies}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground max-sm:hidden">
                    {t.views}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground max-sm:hidden">
                    <RelativeTime date={t.activity} />
                  </TableCell>
                  <TableCell className="w-16 text-center text-muted-foreground hidden max-sm:table-cell relative">
                    <span className="absolute top-2 right-0 text-primary">
                      {t.replies}
                    </span>
                    <span className="absolute bottom-2 right-0">
                      <RelativeTime date={t.activity} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
})
