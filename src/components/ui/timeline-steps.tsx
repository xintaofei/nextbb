import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* -----------------------------------------------------------------------------
 * Timeline (root container)
 * -------------------------------------------------------------------------- */

const timelineStepsVariants = cva("flex", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row overflow-x-auto",
    },
    position: {
      left: "",
      right: "",
      alternate: "",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    position: "left",
  },
})

interface TimelineStepsProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof timelineStepsVariants> {}

function TimelineSteps({
  className,
  orientation,
  position,
  ...props
}: TimelineStepsProps) {
  return (
    <div
      data-slot="timeline-steps"
      data-orientation={orientation}
      data-position={position}
      className={cn(
        timelineStepsVariants({ orientation, position }),
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineItem
 * -------------------------------------------------------------------------- */

const timelineStepsItemVariants = cva("relative flex flex-row w-full gap-4", {
  variants: {
    orientation: {
      vertical: "pb-4 last:pb-0",
      horizontal: "flex-1 items-center",
    },
    status: {
      default: "",
      completed: "",
      current: "",
      upcoming: "opacity-60",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    status: "default",
  },
})

interface TimelineStepsItemProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof timelineStepsItemVariants> {}

function TimelineStepsItem({
  className,
  orientation,
  status,
  ...props
}: TimelineStepsItemProps) {
  return (
    <div
      data-slot="timeline-steps-item"
      data-status={status}
      className={cn(
        timelineStepsItemVariants({ orientation, status }),
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineConnector (the line connecting items)
 * -------------------------------------------------------------------------- */

const timelineStepsConnectorVariants = cva("", {
  variants: {
    orientation: {
      vertical:
        "absolute left-[calc(var(--timeline-steps-icon-size,3rem)/2)] top-[var(--timeline-steps-icon-size,2.5rem)] h-[calc(100%-var(--timeline-steps-icon-size,2.5rem))] w-px -translate-x-1/2",
      horizontal:
        "absolute top-3 left-[calc(50%+0.75rem)] h-px w-[calc(100%-1.5rem)]",
    },
    variant: {
      default: "bg-border",
      dashed: "border-l border-dashed border-border bg-transparent",
      dotted: "border-l border-dotted border-border bg-transparent",
    },
    status: {
      default: "",
      completed: "bg-primary",
      current: "bg-gradient-to-b from-primary to-border",
      upcoming: "bg-muted",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    variant: "default",
    status: "default",
  },
})

interface TimelineStepsConnectorProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof timelineStepsConnectorVariants> {}

function TimelineStepsConnector({
  className,
  orientation,
  variant,
  status,
  ...props
}: TimelineStepsConnectorProps) {
  return (
    <div
      data-slot="timeline-steps-connector"
      aria-hidden="true"
      className={cn(
        timelineStepsConnectorVariants({ orientation, variant, status }),
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineHeader (contains icon and title row)
 * -------------------------------------------------------------------------- */

function TimelineStepsHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-steps-header"
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineStepsIcon (the dot/icon indicator)
 * -------------------------------------------------------------------------- */

const timelineStepsIconVariants = cva(
  "relative z-10 flex shrink-0 items-center justify-center rounded-full border bg-background [--timeline-steps-icon-size:2.5rem]",
  {
    variants: {
      size: {
        sm: "size-6 [--timeline-steps-icon-size:1.5rem] [&>svg]:size-3",
        default: "size-10 [--timeline-steps-icon-size:2.5rem] [&>svg]:size-4",
        lg: "size-12 [--timeline-steps-icon-size:3rem] [&>svg]:size-5",
        xl: "size-16 [--timeline-steps-icon-size:4rem] [&>svg]:size-6",
      },
      variant: {
        default: "border-border text-muted-foreground",
        primary: "border-primary bg-primary text-primary-foreground",
        secondary: "border-secondary bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
        outline: "border-border bg-background text-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

interface TimelineStepsIconProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof timelineStepsIconVariants> {}

function TimelineStepsIcon({
  className,
  size,
  variant,
  ...props
}: TimelineStepsIconProps) {
  return (
    <div
      data-slot="timeline-steps-icon"
      className={cn(timelineStepsIconVariants({ size, variant }), className)}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineStepsContent (container for description, time, etc.)
 * -------------------------------------------------------------------------- */

function TimelineStepsContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-steps-content"
      className={cn(" w-full flex flex-col gap-4", className)}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineStepsTitle
 * -------------------------------------------------------------------------- */

function TimelineStepsTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-steps-title"
      className={cn(
        "text-muted-foreground leading-none font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineDescription
 * -------------------------------------------------------------------------- */

function TimelineStepsDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-steps-description"
      className={cn(
        "text-foreground whitespace-pre-line break-words",
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineStepsAction
 * -------------------------------------------------------------------------- */

function TimelineStepsAction({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-steps-action"
      className={cn(
        "flex flex-row justify-end gap-2 text-muted-foreground text-sm my-4",
        className
      )}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * TimelineStepsTime (timestamp display)
 * -------------------------------------------------------------------------- */

function TimelineStepsTime({
  className,
  ...props
}: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="timeline-steps-time"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  )
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  TimelineSteps,
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsHeader,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsTitle,
  TimelineStepsDescription,
  TimelineStepsAction,
  TimelineStepsTime,
  timelineStepsVariants,
  timelineStepsItemVariants,
  timelineStepsConnectorVariants,
  timelineStepsIconVariants,
}
