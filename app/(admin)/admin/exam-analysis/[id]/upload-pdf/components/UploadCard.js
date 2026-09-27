"use client";

import { Trash2 } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
// PDF上传卡片组件，整合上传区域和PDF预览功能，提供上传和删除操作
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { PdfPreview } from "./PdfPreview.js";
import { UploadArea } from "./UploadArea.js";
export function UploadCard({
  file,
  isDragOver,
  isUploading,
  fileUploaded,
  previewUrl,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDeleteFile,
  onUpload,
  fileInputRef,
  getButtonText,
  cardHeight
}) {
  return <Card className="col-span-1" style={{
    height: `${cardHeight}px`
  }}>
      <CardHeader>
        <CardTitle>上传解析PDF</CardTitle>
        <CardDescription>
          请上传带有答案和解析的PDF文件，支持任意大小
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UploadArea file={file} isDragOver={isDragOver} isUploading={isUploading} onFileChange={onFileChange} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} onDeleteFile={onDeleteFile} fileInputRef={fileInputRef} fileUploaded={fileUploaded} />

        <PdfPreview previewUrl={previewUrl} />
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" type="button" className="text-red-500 hover:bg-red-500 hover:text-white" onClick={onDeleteFile} disabled={!file || isUploading}>
          <Trash2 className="mr-2 h-4 w-4" />
          删除文件
        </Button>
        <Button type="button" onClick={onUpload} disabled={isUploading || !file}>
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>;
}
