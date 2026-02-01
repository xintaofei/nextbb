import React, { memo } from "react"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  pressed?: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
}

export const ToolbarButton = memo(
  ({
    icon,
    label,
    pressed = false,
    onClick,
    disabled = false,
    className,
  }: ToolbarButtonProps) => {
    // Debug: log when pressed changes
    React.useEffect(() => {
      if (label === "粗体" || label === "Bold") {
        console.log(`[ToolbarButton ${label}] pressed:`, pressed)
      }
    }, [pressed, label])

    // Wrap onClick to ignore the pressed parameter from onPressedChange
    const handleClick = React.useCallback(() => {
      onClick()
    }, [onClick])

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={pressed}
            onPressedChange={handleClick}
            disabled={disabled}
            size="sm"
            className={cn(
              "size-8 p-0 cursor-pointer",
              // Force visual feedback when pressed
              pressed && "bg-accent text-accent-foreground",
              className
            )}
            aria-label={label}
          >
            {icon}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }
)

ToolbarButton.displayName = "ToolbarButton"
