"use client";

import { Trash2, Upload } from "lucide-react";
import { Button } from "../../../../../../../../../../components/ui/button.js";
// 图片上传字段组件，用于上传和预览题目相关图片
import { Label } from "../../../../../../../../../../components/ui/label.js";
export function ImageUploadField({
  label,
  fieldId,
  imagePreview,
  onImageSelect,
  onRemoveImage
}) {
  return <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="space-y-2">
        {imagePreview ? <div className="relative border rounded-md p-2 bg-muted/20">
            {}
            <img src={imagePreview} alt={`${label}预览`} className="rounded border max-h-[300px] object-contain mx-auto" />
            <Button type="button" variant="destructive" size="sm" className="absolute top-4 right-4 text-white" onClick={onRemoveImage}>
              <Trash2 className="h-4 w-4 mr-1" />
              删除图片
            </Button>
          </div> : <div className="border-2 border-dashed rounded-md p-6 text-center">
            <input type="file" id={fieldId} accept="image/*" onChange={onImageSelect} className="hidden" />
            <label htmlFor={fieldId} className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                点击选择{label}
              </span>
            </label>
          </div>}
      </div>
    </div>;
}
