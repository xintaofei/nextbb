"use client"

import { useEffect, useState } from "react"
import { useEditorRef, useEditorSelector } from "platejs/react"
import type { PlateEditor } from "platejs/react"
import { TNode, TElement } from "platejs"
import { Node, Editor, Path } from "slate"

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const MENTION_INPUT_PLUGIN_KEY = "mention_input"
const MENTION_PLUGIN_KEY = "mention"

export interface MentionItem {
  key: string
  text: string
  avatar?: string
}

interface MentionComboboxProps {
  items: MentionItem[]
  loading?: boolean
  onSearch?: (search: string) => void
}

interface TMentionNode extends TElement {
  type: string
  value?: string
}

export function MentionCombobox({
  items,
  loading,
  onSearch,
}: MentionComboboxProps) {
  const editor = useEditorRef()

  // Find the mention input node entry
  const mentionInputEntry = useEditorSelector((editor) => {
    const nodes = Array.from(
      Editor.nodes(editor as unknown as Editor, {
        match: (n: Node) =>
          (n as TMentionNode).type === MENTION_INPUT_PLUGIN_KEY,
      })
    )
    return nodes[0] || null
  }, [])

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  // Get the search text from the mention input node and notify parent
  useEffect(() => {
    if (mentionInputEntry && onSearch) {
      const [node] = mentionInputEntry as [TMentionNode, Path]
      const text = Node.string(node as unknown as Node)
      onSearch(text)
    }
  }, [mentionInputEntry, onSearch])

  useEffect(() => {
    if (mentionInputEntry) {
      const [node] = mentionInputEntry
      try {
        const domNode = (editor as unknown as PlateEditor).api.toDOMNode(
          node as unknown as TNode
        ) as HTMLElement | null
        if (domNode) {
          const rect = domNode.getBoundingClientRect()
          const raf = requestAnimationFrame(() => {
            setTargetRect(rect)
          })
          return () => cancelAnimationFrame(raf)
        }
      } catch (e) {
        console.error("Error getting mention input rect:", e)
      }
    }
  }, [mentionInputEntry, editor])

  if (!mentionInputEntry) return null

  const [, path] = mentionInputEntry as [TMentionNode, Path]

  return (
    <Popover open={true}>
      <PopoverAnchor
        virtualRef={{
          current: {
            getBoundingClientRect: () => targetRect || new DOMRect(),
          },
        }}
      />
      <PopoverContent
        className="p-0 w-[240px] overflow-hidden border-none shadow-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="start"
        side="bottom"
        sideOffset={5}
      >
        <Command className="rounded-lg border shadow-md">
          <CommandList className="max-h-[300px] h-auto overflow-y-auto overflow-x-hidden">
            {loading && (
              <div className="p-4 text-sm text-center text-muted-foreground animate-pulse">
                Searching...
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty className="p-4 text-sm text-center text-muted-foreground">
                No results found.
              </CommandEmpty>
            )}
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={item.text}
                  onSelect={() => {
                    const plateEditor = editor as unknown as PlateEditor
                    if (plateEditor.tf) {
                      plateEditor.tf.select(path)
                      plateEditor.tf.insertNodes({
                        type: MENTION_PLUGIN_KEY,
                        value: item.text,
                        userId: item.key,
                        children: [{ text: "" }],
                      } as TMentionNode)
                    }
                  }}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Avatar className="h-7 w-7 border">
                    <AvatarImage src={item.avatar} alt={item.text} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {item.text.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate font-medium text-sm">
                    {item.text}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
