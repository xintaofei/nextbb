"use client"

import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewTopicButtonProps {
  onClick: () => void
  className?: string
}

export function NewTopicButton({ onClick, className }: NewTopicButtonProps) {
  return (
    <Button variant="secondary" onClick={onClick} className={className}>
      <Edit className="mr-2 h-4 w-4" />
      新建话题
    </Button>
  )
}
