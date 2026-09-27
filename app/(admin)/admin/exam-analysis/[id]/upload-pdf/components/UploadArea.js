"use client";

import { CheckCircle, FileText, Upload } from "lucide-react";
// PDF文件上传区域组件，支持拖拽上传和文件选择，显示文件信息和上传状态
import { Button } from "../../../../../../../components/ui/button.js";
export function UploadArea({
  file,
  isDragOver,
  isUploading,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDeleteFile,
  fileInputRef,
  fileUploaded
}) {
  return <div className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center min-h-[200px] transition-colors ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
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
            ✅ 文件已准备就绪，可以上传
          </p>
          {fileUploaded && <p className="text-green-600 text-sm mt-1">✅ 已上传到云存储</p>}
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
    </div>;
}
