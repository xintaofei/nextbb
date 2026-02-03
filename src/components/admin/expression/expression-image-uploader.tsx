"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ExpressionImageUploaderProps = {
  value?: string | null
  onChange: (
    url: string,
    dimensions: { width: number; height: number },
    isAnimated: boolean
  ) => void
  groupCode: string
  expressionCode: string
  disabled?: boolean
}

export function ExpressionImageUploader({
  value,
  onChange,
  groupCode,
  expressionCode,
  disabled,
}: ExpressionImageUploaderProps) {
  const t = useTranslations("AdminExpressions")
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getImageDimensions = useCallback(
    (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
          URL.revokeObjectURL(img.src)
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })
    },
    []
  )

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return

      // Validate file type
      const allowedTypes = [
        "image/png",
        "image/gif",
        "image/jpeg",
        "image/webp",
      ]
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("message.invalidImageType"))
        return
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("message.imageTooLarge"))
        return
      }

      setUploading(true)

      try {
        // Get image dimensions
        const dimensions = await getImageDimensions(file)

        // Upload to server
        const formData = new FormData()
        formData.append("file", file)
        formData.append("groupCode", groupCode)
        formData.append("expressionCode", expressionCode)

        const response = await fetch("/api/admin/expressions/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        onChange(data.url, dimensions, data.isAnimated)
        toast.success(t("message.uploadImageSuccess"))
      } catch (error) {
        console.error("Upload error:", error)
        toast.error(t("message.uploadImageError"))
      } finally {
        setUploading(false)
      }
    },
    [groupCode, expressionCode, onChange, getImageDimensions, t]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0])
      }
    },
    [handleUpload]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0])
      }
    },
    [handleUpload]
  )

  const handleClear = useCallback(() => {
    onChange("", { width: 0, height: 0 }, false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onChange])

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative">
          <div className="rounded-xl border border-border p-4 bg-muted/30 flex items-center justify-center min-h-32">
            <Image
              src={value}
              alt="Preview"
              width={192}
              height={192}
              className="max-w-full max-h-48 object-contain"
            />
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClear}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center cursor-pointer transition-colors",
            dragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/gif,image/jpeg,image/webp"
            onChange={handleChange}
            disabled={disabled || uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("message.uploadImageSuccess")}...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {t("expressionDialog.dragHint")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("expressionDialog.uploadHint")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
