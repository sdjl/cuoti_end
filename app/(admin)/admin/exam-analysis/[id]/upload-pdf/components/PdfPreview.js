"use client";

// PDF预览组件，用于在iframe中预览上传的PDF文件
export function PdfPreview({
  previewUrl
}) {
  return <div className="p-4 min-h-[200px] flex items-center justify-center border rounded-md mt-2">
      {previewUrl ? <div className="w-full h-full">
          <iframe src={previewUrl} className="w-full h-[200px] border-0" title="PDF预览" />
        </div> : <p className="text-center text-gray-400">请先上传PDF文件后预览</p>}
    </div>;
}
