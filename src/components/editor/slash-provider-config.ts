import React from "react"
import { SlashProvider } from "@milkdown/kit/plugin/slash"
import { EditorView } from "@milkdown/kit/prose/view"
import { EditorState } from "@milkdown/kit/prose/state"

export interface PluginState {
  open: boolean
  x: number
  y: number
  query: string
}

export const createSlashProviderConfig = ({
  trigger,
  providerFactory: ProviderClass,
  onStateChange,
  ref,
}: {
  trigger: string
  providerFactory: typeof SlashProvider
  onStateChange: (state: (prev: PluginState) => PluginState) => void
  ref: React.MutableRefObject<{
    onKeyDown: (e: KeyboardEvent) => boolean
  } | null>
}) => {
  return {
    props: {
      handleKeyDown: (_view: EditorView, event: KeyboardEvent) => {
        if (!ref.current) return false
        return ref.current.onKeyDown(event)
      },
    },
    view: () => {
      const content = document.createElement("div")
      // Add to body for SlashProvider to use, but we'll use coords for positioning
      content.style.position = "fixed"
      content.style.visibility = "hidden"
      document.body.appendChild(content)

      const provider = new ProviderClass({
        content,
        trigger: [trigger],
      })

      return {
        update: (updatedView: EditorView, prevState?: EditorState) => {
          provider.update(updatedView, prevState)
          const query = provider.getContent(updatedView)

          const { selection } = updatedView.state
          const { $from } = selection

          // Check if the current line has the trigger before the cursor
          const textBefore = $from.parent.textBetween(
            Math.max(0, $from.parentOffset - 50),
            $from.parentOffset,
            undefined,
            "\uFFFC"
          )

          const lastAtIndex = textBefore.lastIndexOf(trigger)

          // Check if trigger is at the start or preceded by whitespace
          const isAtStart = lastAtIndex === 0
          const isPrecededBySpace =
            lastAtIndex > 0 && /[\s\u00A0]/.test(textBefore[lastAtIndex - 1])

          const isActive =
            lastAtIndex !== -1 &&
            (isAtStart || isPrecededBySpace) &&
            !textBefore.slice(lastAtIndex + 1).includes(" ")

          const nextOpen = isActive && typeof query === "string"
          const nextQuery = isActive ? textBefore.slice(lastAtIndex + 1) : ""

          if (nextOpen) {
            // Get actual cursor coordinates only when needed to avoid performance overhead
            const coords = updatedView.coordsAtPos(selection.from)

            onStateChange((prev: PluginState) => {
              if (
                prev.open === nextOpen &&
                prev.query === nextQuery &&
                prev.x === coords.left &&
                prev.y === coords.bottom
              ) {
                return prev
              }

              return {
                open: nextOpen,
                x: coords.left,
                y: coords.bottom,
                query: nextQuery,
              }
            })
          } else {
            onStateChange((prev: PluginState) => {
              if (!prev.open) return prev
              return {
                ...prev,
                open: false,
              }
            })
          }
        },
        destroy: () => {
          provider.destroy()
          content.remove()
          onStateChange((prev: PluginState) => ({ ...prev, open: false }))
        },
      }
    },
  }
}
