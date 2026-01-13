import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { MilkdownEditor } from "@/components/milkdown"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type DrawerEditorProps = {
  title: string
  description?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: string
  submitting?: boolean
  onSubmit: (content: string) => void | Promise<void>
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
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setValue(initialValue)
    }
    onOpenChange(o)
  }
  const handleSubmit = () => {
    onSubmit(value.trim())
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
          <div className="min-h-[200px] border rounded-md overflow-hidden">
            <MilkdownEditor
              value={value}
              onChange={(val) => setValue(val)}
              className="min-h-[200px]"
            />
          </div>
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
