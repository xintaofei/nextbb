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
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

const MENTION_INPUT_PLUGIN_KEY = "mention_input"
const MENTION_PLUGIN_KEY = "mention"

interface MentionItem {
  key: string
  text: string
}

interface MentionComboboxProps {
  items: MentionItem[]
}

interface TMentionNode extends TElement {
  type: string
  value?: string
}

export function MentionCombobox({ items }: MentionComboboxProps) {
  const editor = useEditorRef()

  // Find the mention input node entry
  // We use useEditorSelector to subscribe to changes
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

  useEffect(() => {
    if (mentionInputEntry) {
      const [node] = mentionInputEntry
      try {
        const domNode = (editor as unknown as PlateEditor).api.toDOMNode(
          node as unknown as TNode
        ) as HTMLElement | null
        if (domNode) {
          const rect = domNode.getBoundingClientRect()
          // Use requestAnimationFrame to avoid "cascading renders" warning
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

  const [node, path] = mentionInputEntry as [TMentionNode, Path]
  const text = Node.string(node as unknown as Node)

  const filteredItems = items.filter((item) =>
    item.text.toLowerCase().includes(text.toLowerCase())
  )

  if (filteredItems.length === 0) return null

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
        className="p-0 w-[200px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="start"
        side="bottom"
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {filteredItems.map((item) => (
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
                        children: [{ text: "" }],
                      } as TMentionNode)
                    }
                  }}
                  className="cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {item.text}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
