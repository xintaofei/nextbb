"use client"

import type { Value } from "platejs"
import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react"
import { Plate, usePlateEditor } from "platejs/react"
import { createStaticEditor, serializeHtml } from "platejs/static"

import { BaseBasicBlocksKit } from "./plugins/basic-blocks-base-kit"
import { BaseBasicMarksKit } from "./plugins/basic-marks-base-kit"
import { mentionPlugins } from "./plugins/mention-kit"
import { BlockquoteElement } from "@/components/ui/blockquote-node"
import { Editor, EditorContainer } from "@/components/ui/editor"
import { FixedToolbar } from "@/components/ui/fixed-toolbar"
import { H1Element, H2Element, H3Element } from "@/components/ui/heading-node"
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button"
import { MentionCombobox } from "@/components/ui/mention-combobox"
import { ToolbarButton } from "@/components/ui/toolbar"

const initialValue: Value = [
  {
    children: [{ text: "" }],
    type: "p",
  },
]

const MENTION_ITEMS = [
  { key: "0", text: "Alice" },
  { key: "1", text: "Bob" },
  { key: "2", text: "Charlie" },
  { key: "3", text: "David" },
  { key: "4", text: "Eve" },
]

interface ContentEditorProps {
  value?: Value
  onChange?: (value: Value, html: string) => void
  placeholder?: string
}

export function ContentEditor({
  value,
  onChange,
  placeholder = "Type your amazing content here...",
}: ContentEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      ...mentionPlugins,
    ],
    value: value ?? initialValue,
  })

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        if (onChange) {
          const staticEditor = createStaticEditor({
            plugins: [...BaseBasicBlocksKit, ...BaseBasicMarksKit],
            value: value,
          })
          serializeHtml(staticEditor).then((html) => {
            onChange(value, html)
          })
        }
      }}
    >
      <div className="border rounded-lg">
        <FixedToolbar className="flex justify-start gap-1">
          <ToolbarButton onClick={() => editor.tf.h1.toggle()}>
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h2.toggle()}>
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h3.toggle()}>
            H3
          </ToolbarButton>

          <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>
            Quote
          </ToolbarButton>

          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            B
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            I
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            U
          </MarkToolbarButton>
        </FixedToolbar>

        <EditorContainer className="max-h-80 overflow-y-auto">
          <Editor variant="select" placeholder={placeholder} />
        </EditorContainer>
        <MentionCombobox items={MENTION_ITEMS} />
      </div>
    </Plate>
  )
}
