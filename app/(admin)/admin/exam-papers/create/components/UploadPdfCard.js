"use client";

import { CheckCircle, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// PDF上传卡片组件，用于创建试卷时上传和预览PDF文件
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export function UploadPdfCard({
  file,
  isDragOver,
  isUploading,
  previewUrl,
  title,
  subject,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDeleteFile,
  onSubmit,
  fileInputRef,
  getButtonText
}) {
  return <Card className="col-span-1">
      <CardHeader>
        <CardTitle>上传试卷</CardTitle>
        <CardDescription>请上传试卷PDF文件，支持任意大小</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center min-h-[200px] transition-colors ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
          {file ? <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-blue-500 mr-2" />
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-green-600 font-medium mb-2">已选择文件:</p>
              <p className="text-gray-700">{file.name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-green-600 text-sm mt-1">
                ✅ 文件已准备就绪，可以创建试卷
              </p>
              <Button variant="outline" className="mt-4" onClick={onDeleteFile} type="button" disabled={isUploading}>
                重新选择
              </Button>
            </div> : <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg text-gray-500 mb-2">
                拖拽文件到此处或点击下方按钮上传
              </p>
              <p className="text-sm text-gray-400 mb-4">支持 .pdf 格式文件</p>
              <Button type="button" variant="outline" asChild disabled={isUploading}>
                <label>
                  选择文件
                  <input ref={fileInputRef} name="file" type="file" accept=".pdf" onChange={onFileChange} className="sr-only" disabled={isUploading} />
                </label>
              </Button>
            </>}
        </div>

        <div className="p-4 min-h-[200px] flex items-center justify-center border rounded-md mt-2">
          {previewUrl ? <div className="w-full h-full">
              <iframe src={previewUrl} className="w-full h-[200px] border-0" title="PDF预览" />
            </div> : <p className="text-center text-gray-400">请先上传PDF文件后预览</p>}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" type="button" className="text-red-500 hover:bg-red-500 hover:text-white" onClick={onDeleteFile} disabled={!file || isUploading}>
          <Trash2 className="mr-2 h-4 w-4" />
          删除文件
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isUploading || !title || !subject || !file}>
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>;
}
