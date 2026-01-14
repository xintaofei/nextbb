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
import { MilkdownEditorWrapper } from "@/components/editor/content-editor"

type DrawerEditorProps = {
  title: string
  description?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: string
  submitting?: boolean
  onSubmit: (content: string, contentHtml?: string) => void | Promise<void>
  submitText: string
  cancelText: string
}

export function DrawerEditor({
  title,
  description,
  open,
  onOpenChange,
  initialValue = "",
  submitting = false,
  onSubmit,
  submitText,
  cancelText,
}: DrawerEditorProps) {
  const [value, setValue] = useState<string>(initialValue)
  const [html, setHtml] = useState<string>("")

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setValue(initialValue)
      setHtml("")
    }
    onOpenChange(o)
  }
  const handleSubmit = () => {
    onSubmit(value.trim(), html)
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
          <MilkdownEditorWrapper
            value={value}
            onChange={(val, json, h) => {
              setValue(val)
              setHtml(h || "")
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
