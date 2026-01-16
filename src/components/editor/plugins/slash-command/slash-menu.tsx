import { useState, forwardRef, useImperativeHandle, useMemo } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  ImageIcon,
} from "lucide-react"

export interface SlashCommand {
  id: string
  label: string
  icon: React.ReactNode
  actionId: string
}

const COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    label: "heading1",
    icon: <Heading1 className="w-4 h-4" />,
    actionId: "h1",
  },
  {
    id: "h2",
    label: "heading2",
    icon: <Heading2 className="w-4 h-4" />,
    actionId: "h2",
  },
  {
    id: "h3",
    label: "heading3",
    icon: <Heading3 className="w-4 h-4" />,
    actionId: "h3",
  },
  {
    id: "h4",
    label: "heading4",
    icon: <Heading4 className="w-4 h-4" />,
    actionId: "h4",
  },
  {
    id: "bullet-list",
    label: "bulletList",
    icon: <List className="w-4 h-4" />,
    actionId: "bulletList",
  },
  {
    id: "ordered-list",
    label: "orderedList",
    icon: <ListOrdered className="w-4 h-4" />,
    actionId: "orderedList",
  },
  {
    id: "code-block",
    label: "codeBlock",
    icon: <Code className="w-4 h-4" />,
    actionId: "codeBlock",
  },
  {
    id: "quote",
    label: "quote",
    icon: <Quote className="w-4 h-4" />,
    actionId: "blockquote",
  },
  {
    id: "image",
    label: "image",
    icon: <ImageIcon className="w-4 h-4" />,
    actionId: "image",
  },
  {
    id: "divider",
    label: "divider",
    icon: <Minus className="w-4 h-4" />,
    actionId: "hr",
  },
]

interface SlashMenuProps {
  query: string
  onSelect: (command: SlashCommand) => void
  onClose: () => void
}

export interface SlashMenuRef {
  onKeyDown: (e: KeyboardEvent) => boolean
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ query, onSelect, onClose }, ref) => {
    const t = useTranslations("Editor.SlashCommand")

    const translatedCommands = useMemo(
      () =>
        COMMANDS.map((cmd) => ({
          ...cmd,
          label: t(cmd.label),
        })),
      [t]
    )

    const filteredCommands = translatedCommands.filter((cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase())
    )

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [prevQuery, setPrevQuery] = useState(query)

    // Reset selection when query changes
    if (query !== prevQuery) {
      setPrevQuery(query)
      setSelectedIndex(0)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
          return true
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length
          )
          return true
        }
        if (e.key === "Enter") {
          e.preventDefault()
          if (filteredCommands.length > 0) {
            onSelect(filteredCommands[selectedIndex])
            return true
          }
        }
        if (e.key === "Escape") {
          e.preventDefault()
          onClose()
          return true
        }
        return false
      },
    }))

    if (filteredCommands.length === 0) {
      return (
        <div className="w-48 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden p-1">
          <div className="p-2 text-sm text-muted-foreground">
            {t("noCommands")}
          </div>
        </div>
      )
    }

    return (
      <div
        className="w-48 max-h-96 overflow-y-auto bg-popover text-popover-foreground rounded-md border shadow-md p-1"
        onWheel={(e) => e.stopPropagation()}
      >
        {filteredCommands.map((cmd, index) => (
          <div
            key={cmd.id}
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
              onSelect(cmd)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center justify-center text-muted-foreground">
              {cmd.icon}
            </div>
            <span className="font-medium">{cmd.label}</span>
          </div>
        ))}
      </div>
    )
  }
)

SlashMenu.displayName = "SlashMenu"
