import React, { memo, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  MoreVertical,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { editorViewCtx, schemaCtx } from "@milkdown/kit/core"
import { setBlockType, wrapIn } from "@milkdown/kit/prose/commands"
import { TextSelection } from "@milkdown/kit/prose/state"
import type { Ctx } from "@milkdown/ctx"
import { ToolbarButton } from "./toolbar-button"
import { HeadingDropdown } from "./heading-dropdown"
import { LinkDialog } from "./link-dialog"
import { ExpressionPicker } from "./expression-picker"
import { useToolbarState } from "./use-toolbar-state"
import { toggleMarkInEditor } from "../mark-utils"
import type { Expression } from "@/types/expression"

interface EditorToolbarProps {
  getEditor: () =>
    | ReturnType<typeof import("@milkdown/kit/core").Editor.make>
    | undefined
}

export const EditorToolbar = memo(({ getEditor }: EditorToolbarProps) => {
  const t = useTranslations("Editor.Toolbar")
  const toolbarState = useToolbarState(getEditor)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  // Execute editor command
  const executeCommand = useCallback(
    (fn: (ctx: Ctx) => void) => {
      const editor = getEditor()
      if (!editor) return
      editor.action(fn)
    },
    [getEditor]
  )

  // Text formatting commands
  const handleBold = useCallback(() => {
    executeCommand((ctx) => {
      toggleMarkInEditor(ctx, (schema: unknown) => {
        const s = schema as Record<string, unknown>
        return (s.marks as Record<string, unknown>)?.strong
      })
    })
  }, [executeCommand])

  const handleItalic = useCallback(() => {
    executeCommand((ctx) => {
      toggleMarkInEditor(ctx, (schema: unknown) => {
        const s = schema as Record<string, unknown>
        const marks = s.marks as Record<string, unknown>
        return marks?.em || marks?.emphasis
      })
    })
  }, [executeCommand])

  const handleStrikethrough = useCallback(() => {
    executeCommand((ctx) => {
      const schema = ctx.get(schemaCtx) as unknown as Record<string, unknown>
      const marks = schema.marks as Record<string, unknown>
      if (!marks?.strike_through) {
        console.warn("Strikethrough mark not found")
        return
      }
      toggleMarkInEditor(ctx, (schema: unknown) => {
        const s = schema as Record<string, unknown>
        return (s.marks as Record<string, unknown>)?.strike_through
      })
    })
  }, [executeCommand])

  const handleInlineCode = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx) as unknown as Record<string, unknown>
      const marks = schema.marks as Record<string, unknown>
      const codeMarkType = (marks?.inlineCode || marks?.code) as
        | import("@milkdown/kit/prose/model").MarkType
        | undefined

      if (!codeMarkType) {
        console.warn("Inline code mark not found")
        return
      }

      const { state, dispatch } = view
      const { from, to, empty } = state.selection

      // Check if active
      let isActive = false
      if (empty) {
        const storedMarks = state.storedMarks || state.selection.$from.marks()
        isActive = storedMarks.some((m) => m.type === codeMarkType)
      } else {
        let hasText = false
        let allHaveMark = true
        state.doc.nodesBetween(from, to, (node) => {
          if (node.isText) {
            hasText = true
            if (!node.marks.some((m) => m.type === codeMarkType)) {
              allHaveMark = false
              return false
            }
          }
          return true
        })
        isActive = hasText && allHaveMark
      }

      if (isActive) {
        toggleMarkInEditor(ctx, (schema: unknown) => {
          const s = schema as Record<string, unknown>
          return (s.marks as Record<string, unknown>)?.inlineCode
        })
        return
      }

      // Toggle ON: Add spaces
      const tr = state.tr
      if (empty) {
        tr.insertText("  ")
        tr.setSelection(TextSelection.create(tr.doc, from + 1))
        tr.addStoredMark(codeMarkType.create())
      } else {
        tr.insertText(" ", to)
        tr.insertText(" ", from)
        tr.addMark(from + 1, to + 1, codeMarkType.create())
        tr.setSelection(TextSelection.create(tr.doc, from + 1, to + 1))
      }
      dispatch(tr)
      view.focus()
    })
  }, [executeCommand])

  // Heading command
  const handleHeading = useCallback(
    (level: number | null) => {
      executeCommand((ctx) => {
        const view = ctx.get(editorViewCtx)
        const schema = ctx.get(schemaCtx)
        const { state, dispatch } = view

        if (level === null) {
          setBlockType(schema.nodes.paragraph)(state, dispatch)
        } else {
          setBlockType(schema.nodes.heading, { level })(state, dispatch)
        }

        view.focus()
      })
    },
    [executeCommand]
  )

  // List commands
  const handleBulletList = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      // Check if already in bullet list
      let inList = false
      for (let d = state.selection.$from.depth; d > 0; d--) {
        if (state.selection.$from.node(d).type.name === "bullet_list") {
          inList = true
          break
        }
      }

      if (inList) {
        // Exit list
        setBlockType(schema.nodes.paragraph)(state, dispatch)
      } else {
        // Enter list
        wrapIn(schema.nodes.bullet_list)(state, dispatch)
      }

      view.focus()
    })
  }, [executeCommand])

  const handleOrderedList = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      // Check if already in ordered list
      let inList = false
      for (let d = state.selection.$from.depth; d > 0; d--) {
        if (state.selection.$from.node(d).type.name === "ordered_list") {
          inList = true
          break
        }
      }

      if (inList) {
        // Exit list
        setBlockType(schema.nodes.paragraph)(state, dispatch)
      } else {
        // Enter list
        wrapIn(schema.nodes.ordered_list)(state, dispatch)
      }

      view.focus()
    })
  }, [executeCommand])

  // Block commands
  const handleBlockquote = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      // Check if already in blockquote
      let inBlockquote = false
      for (let d = state.selection.$from.depth; d > 0; d--) {
        if (state.selection.$from.node(d).type.name === "blockquote") {
          inBlockquote = true
          break
        }
      }

      if (inBlockquote) {
        // Exit blockquote
        setBlockType(schema.nodes.paragraph)(state, dispatch)
      } else {
        // Enter blockquote
        wrapIn(schema.nodes.blockquote)(state, dispatch)
      }

      view.focus()
    })
  }, [executeCommand])

  const handleCodeBlock = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      if (state.selection.$from.parent.type.name === "code_block") {
        setBlockType(schema.nodes.paragraph)(state, dispatch)
      } else {
        setBlockType(schema.nodes.code_block)(state, (tr) => {
          const { $to } = tr.selection
          const pos = $to.after()
          const p = schema.nodes.paragraph.createAndFill()
          if (p) {
            tr.insert(pos, p)
          }
          dispatch(tr)
        })
      }

      view.focus()
    })
  }, [executeCommand])

  // Link command
  const handleLink = useCallback(
    (url: string, text?: string) => {
      executeCommand((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state, dispatch } = view
        const schema = ctx.get(schemaCtx)
        const { from, to } = state.selection

        // If no selection, insert text with link
        if (from === to) {
          const displayText = text || url
          const linkMark = schema.marks.link.create({ href: url })
          const tr = state.tr
            .insertText(displayText)
            .addMark(from, from + displayText.length, linkMark)
          dispatch(tr)
        } else {
          // If text selected, apply link mark (use selected text as display)
          const linkMark = schema.marks.link.create({ href: url })
          const tr = state.tr.addMark(from, to, linkMark)
          dispatch(tr)
        }

        view.focus()
      })
    },
    [executeCommand]
  )

  // Image command
  const handleImage = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      const tr = state.tr.replaceSelectionWith(
        schema.nodes.image_block.create()
      )
      dispatch(tr)

      view.focus()
    })
  }, [executeCommand])

  // HR command
  const handleHR = useCallback(() => {
    executeCommand((ctx) => {
      const view = ctx.get(editorViewCtx)
      const schema = ctx.get(schemaCtx)
      const { state, dispatch } = view

      const tr = state.tr.replaceSelectionWith(schema.nodes.hr.create())
      dispatch(tr)

      view.focus()
    })
  }, [executeCommand])

  // Expression command
  const handleExpression = useCallback(
    (expression: Expression) => {
      executeCommand((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state, dispatch } = view

        if (expression.imageUrl) {
          const schema = ctx.get(schemaCtx)
          const node = schema.nodes.image.create({
            src: expression.imageUrl,
            alt: expression.name,
          })
          const tr = state.tr.replaceSelectionWith(node)
          dispatch(tr)
        }

        view.focus()
      })
    },
    [executeCommand]
  )

  return (
    <div className="flex flex-col border-b bg-muted/30 sticky top-0 z-40">
      {/* Desktop toolbar */}
      <div className="hidden md:flex items-center gap-1 px-2 py-1.5 flex-wrap">
        {/* Text formatting */}
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label={t("bold")}
          pressed={toolbarState.bold}
          onClick={handleBold}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label={t("italic")}
          pressed={toolbarState.italic}
          onClick={handleItalic}
        />
        <ToolbarButton
          icon={<Strikethrough className="h-4 w-4" />}
          label={t("strikethrough")}
          pressed={toolbarState.strikethrough}
          onClick={handleStrikethrough}
        />
        <ToolbarButton
          icon={<Code className="h-4 w-4" />}
          label={t("code")}
          pressed={toolbarState.code}
          onClick={handleInlineCode}
        />

        <Separator orientation="vertical" className="h-6" />

        {/* Heading */}
        <HeadingDropdown
          currentLevel={toolbarState.headingLevel}
          onSelect={handleHeading}
        />

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label={t("bulletList")}
          pressed={toolbarState.isBulletList}
          onClick={handleBulletList}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          label={t("orderedList")}
          pressed={toolbarState.isOrderedList}
          onClick={handleOrderedList}
        />

        <Separator orientation="vertical" className="h-6" />

        {/* Block elements */}
        <ToolbarButton
          icon={<Quote className="h-4 w-4" />}
          label={t("blockquote")}
          pressed={toolbarState.isBlockquote}
          onClick={handleBlockquote}
        />
        <ToolbarButton
          icon={<Code2 className="h-4 w-4" />}
          label={t("codeBlock")}
          pressed={toolbarState.isCodeBlock}
          onClick={handleCodeBlock}
        />

        <Separator orientation="vertical" className="h-6" />

        {/* Insert elements */}
        <ToolbarButton
          icon={<LinkIcon className="h-4 w-4" />}
          label={t("link")}
          onClick={() => setLinkDialogOpen(true)}
        />
        <ToolbarButton
          icon={<ImageIcon className="h-4 w-4" />}
          label={t("image")}
          onClick={handleImage}
        />
        <ExpressionPicker onSelect={handleExpression} />
        <ToolbarButton
          icon={<Minus className="h-4 w-4" />}
          label={t("hr")}
          onClick={handleHR}
        />
      </div>

      {/* Mobile toolbar */}
      <div className="flex md:hidden items-center gap-1 px-2 py-1.5">
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label={t("bold")}
          pressed={toolbarState.bold}
          onClick={handleBold}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label={t("italic")}
          pressed={toolbarState.italic}
          onClick={handleItalic}
        />
        <ToolbarButton
          icon={<LinkIcon className="h-4 w-4" />}
          label={t("link")}
          onClick={() => setLinkDialogOpen(true)}
        />
        <ExpressionPicker onSelect={handleExpression} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t("more")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleStrikethrough}>
              {t("strikethrough")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInlineCode}>
              {t("code")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleHeading(1)}>
              {t("heading1")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(2)}>
              {t("heading2")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(3)}>
              {t("heading3")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulletList}>
              {t("bulletList")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOrderedList}>
              {t("orderedList")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBlockquote}>
              {t("blockquote")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCodeBlock}>
              {t("codeBlock")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImage}>
              {t("image")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHR}>{t("hr")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onInsert={handleLink}
        mode="insert"
      />
    </div>
  )
})

EditorToolbar.displayName = "EditorToolbar"
