"use client";

// 错题图片上传组件，负责采集答题照片并处理上传、预览与删除流程
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB, SUPPORTED_IMAGE_TYPES } from "../../../../../../../lib/config/constants.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function ImageUploader({
  questionId,
  initialImageUrl,
  initialImageFileID,
  onImageUpload,
  onImageDelete
}) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || null);
  const [imageFileID, setImageFileID] = useState(initialImageFileID || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // 当初始值变化时更新状态
  useEffect(() => {
    setImageUrl(initialImageUrl || null);
    setImageFileID(initialImageFileID || null);
  }, [initialImageUrl, initialImageFileID]);
  const validateFile = file => {
    // 检查文件类型
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return "只支持 JPG、PNG、WebP、GIF 格式的图片";
    }

    // 检查文件大小
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `图片大小不能超过 ${MAX_IMAGE_SIZE_MB}MB`;
    }
    return null;
  };
  const convertFileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // 移除 data:image/jpeg;base64, 前缀，只保留base64内容
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const handleFileUpload = async file => {
    setUploadError(null);
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    try {
      setIsUploading(true);

      // 如果已有图片，先删除
      if (imageFileID) {
        await handleImageDelete();
      }

      // 转换为base64
      const base64 = await convertFileToBase64(file);

      // 上传新图片
      const result = await onImageUpload(questionId, {
        base64,
        originalName: file.name,
        mimeType: file.type
      });
      if (result.success && result.imageUrl && result.imageFileID) {
        setImageUrl(result.imageUrl);
        setImageFileID(result.imageFileID);
        setUploadError(null);
      } else {
        setUploadError(result.error || "上传失败");
      }
    } catch (error) {
      console.error("上传图片失败:", error);
      setUploadError("上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };
  const handleImageDelete = async () => {
    if (!imageFileID) return;
    try {
      setIsDeleting(true);
      const result = await onImageDelete(imageFileID);
      if (result.success) {
        setImageUrl(null);
        setImageFileID(null);
        setUploadError(null);
      } else {
        setUploadError(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除图片失败:", error);
      setUploadError("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleFileSelect = e => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // 清空输入框，以便可以重复选择同一个文件
    e.target.value = "";
  };
  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `pasted-image.${type.split("/")[1]}`, {
              type
            });
            handleFileUpload(file);
            return;
          }
        }
      }
      setUploadError("剪贴板中没有图片");
    } catch (error) {
      console.error("粘贴失败:", error);
      setUploadError("粘贴失败，请检查浏览器权限");
    }
  };
  const isButtonDisabled = isUploading || isDeleting;
  const hasImage = !!imageUrl;
  return <div className="space-y-4">
      {/* 标题和按钮行 */}
      <div className="flex items-center gap-4">
        <h4 className="text-sm font-medium text-gray-700">上传错题图片</h4>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isButtonDisabled || hasImage} className="h-8 px-3 text-xs">
            <Upload className="w-3 h-3 mr-1" />
            选择图片
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handlePaste} disabled={isButtonDisabled || hasImage} className="h-8 px-3 text-xs">
            <ImageIcon className="w-3 h-3 mr-1" />
            粘贴图片
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleImageDelete} disabled={!imageUrl || isButtonDisabled} className="h-8 px-3 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            删除图片
          </Button>
        </div>
      </div>

      {/* 拖拽上传区域 */}
      <div className={cn("border-2 border-dashed rounded-lg p-3 text-center transition-colors", dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300", isButtonDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400")} onDragEnter={!hasImage ? handleDragEnter : undefined} onDragLeave={!hasImage ? handleDragLeave : undefined} onDragOver={!hasImage ? handleDragOver : undefined} onDrop={!hasImage ? handleDrop : undefined} onClick={() => !isButtonDisabled && !hasImage && fileInputRef.current?.click()}>
        {imageUrl ? <BaseImage src={imageUrl} alt="错题图片" width={800} height={600} className="mx-auto max-w-full h-auto rounded-lg shadow-sm" /> : <div className="text-gray-500">
            {isUploading ? <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                上传中...
              </div> : <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">点击选择、拖拽或粘贴图片</p>
                <p className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG、WebP、GIF，最大 {MAX_IMAGE_SIZE_MB}MB
                </p>
              </>}
          </div>}
      </div>

      {/* 错误信息 */}
      {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}

      {/* 隐藏的文件输入框 */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>;
}
