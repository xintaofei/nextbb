import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ContentEditor } from "./content-editor"
import type { Value } from "platejs"

type DrawerEditorProps = {
  title: string
  description?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: Value
  submitting?: boolean
  onSubmit: (content: Value, html: string) => void | Promise<void>
  submitText: string
  cancelText: string
}

export function DrawerEditor({
  title,
  description,
  open,
  onOpenChange,
  initialValue,
  submitting = false,
  onSubmit,
  submitText,
  cancelText,
}: DrawerEditorProps) {
  const [value, setValue] = useState<Value | undefined>(initialValue)
  const [html, setHtml] = useState<string>("")

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setValue(initialValue)
    }
    onOpenChange(o)
  }

  const handleSubmit = () => {
    if (value) {
      onSubmit(value, html)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className="px-4">
          <ContentEditor
            value={value}
            onChange={(val, h) => {
              setValue(val)
              setHtml(h)
            }}
          />
        </div>
        <DrawerFooter>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelText}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitText}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
