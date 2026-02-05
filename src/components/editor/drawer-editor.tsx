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
  placeholder?: string
  slashPlaceholder?: string
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
  placeholder,
  slashPlaceholder,
}: DrawerEditorProps) {
  const [value, setValue] = useState<string>(initialValue)
  const [html, setHtml] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setValue(initialValue)
      setHtml("")
      setIsSyncing(false)
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
          <DrawerDescription className={description ? "" : "sr-only"}>
            {description || "Editor"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex justify-center px-4 w-full max-w-3xl mx-auto">
          <MilkdownEditorWrapper
            value={value}
            placeholder={placeholder}
            slashPlaceholder={slashPlaceholder}
            autoFocus={open}
            onChange={(val, json, h) => {
              setValue(val)
              setHtml(h || "")
            }}
            onPendingChange={setIsSyncing}
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
            <Button onClick={handleSubmit} disabled={submitting || isSyncing}>
              {submitText}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
