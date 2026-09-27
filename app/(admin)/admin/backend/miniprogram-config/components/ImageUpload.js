"use client";

import { ImageIcon, Upload } from "lucide-react";
// 图片上传组件，用于上传和管理小程序配置中的联系方式二维码和系统Logo图片
import { useRef, useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { uploadContactQRCode, uploadSystemLogo } from "../actions.js";

// 图片上传配置类型

// 图片上传配置列表
const imageUploadConfigs = [{
  key: "contacts",
  title: "联系方式配置",
  description: "上传的二维码图片会显示在小程序的首页以及联系方式页面中。建议上传清晰的微信群二维码或客服二维码。",
  uploadLabel: "联系我们二维码",
  validation: {
    maxSizeKB: 100,
    // 100KB
    maxWidth: 300 // 300px
  },
  uploadAction: uploadContactQRCode,
  getCurrentImage: config => {
    const contacts = config.contacts;
    if (!contacts || !contacts.qrcodeUrl) return null;
    return {
      url: contacts.qrcodeUrl,
      version: contacts.qrcodeVersion,
      pathPrefix: "contact-qrcode"
    };
  },
  updateConfig: (config, data) => ({
    ...config,
    contacts: {
      ...config.contacts,
      qrcodeUrl: data.qrcodeUrl,
      qrcodeVersion: data.qrcodeVersion
    }
  }),
  emptyStateText: "尚未上传联系我们的二维码图片",
  successMessage: "联系方式二维码上传成功"
}, {
  key: "systemLogo",
  title: "系统Logo配置",
  description: "上传的Logo图片会显示在小程序的各个页面中作为系统标识。建议上传清晰的Logo图片。",
  uploadLabel: "系统Logo",
  validation: {
    maxSizeKB: 200,
    // 200KB，Logo可以稍大一些
    maxWidth: 500,
    // 500px，Logo可以更大一些
    maxHeight: 500 // 500px
  },
  uploadAction: uploadSystemLogo,
  getCurrentImage: config => {
    const systemLogo = config.systemLogo;
    if (!systemLogo || !systemLogo.logoUrl) return null;
    return {
      url: systemLogo.logoUrl,
      version: systemLogo.logoVersion,
      pathPrefix: "system-logo"
    };
  },
  updateConfig: (config, data) => ({
    ...config,
    systemLogo: {
      ...config.systemLogo,
      logoUrl: data.logoUrl,
      logoVersion: data.logoVersion
    }
  }),
  emptyStateText: "尚未上传系统Logo图片",
  successMessage: "系统Logo上传成功"
}];

// 生成验证配置的描述文本
function getValidationDescription(validation) {
  const parts = ["支持 JPEG、PNG、WebP 格式"];
  parts.push(`文件大小不超过 ${validation.maxSizeKB}KB`);
  if (validation.maxWidth && validation.maxHeight) {
    parts.push(`尺寸不超过 ${validation.maxWidth}x${validation.maxHeight}px`);
  } else if (validation.maxWidth) {
    parts.push(`宽度不超过 ${validation.maxWidth}px`);
  } else if (validation.maxHeight) {
    parts.push(`高度不超过 ${validation.maxHeight}px`);
  }
  return parts.join("，");
}

// 单个图片上传项组件
function ImageUploadItem({
  itemConfig,
  config,
  onConfigChange
}) {
  const [isUploading, setIsUploading] = useState(false);
  const {
    toast
  } = useToast();
  const fileInputRef = useRef(null);

  // 验证图片尺寸
  const validateImageDimensions = (file, validation) => {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);

        // 检查宽度限制
        if (validation.maxWidth && img.width > validation.maxWidth) {
          resolve({
            valid: false,
            width: img.width,
            height: img.height,
            message: `图片宽度为${img.width}px，不能超过${validation.maxWidth}px`
          });
          return;
        }

        // 检查高度限制
        if (validation.maxHeight && img.height > validation.maxHeight) {
          resolve({
            valid: false,
            width: img.width,
            height: img.height,
            message: `图片高度为${img.height}px，不能超过${validation.maxHeight}px`
          });
          return;
        }
        resolve({
          valid: true,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          valid: false,
          message: "图片格式无效"
        });
      };
      img.src = url;
    });
  };

  // 处理文件选择
  const handleFileSelect = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const {
      validation
    } = itemConfig;

    // 客户端验证文件大小
    const maxSize = validation.maxSizeKB * 1024;
    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: `文件大小不能超过${validation.maxSizeKB}KB`,
        variant: "destructive"
      });
      return;
    }

    // 客户端验证图片尺寸
    try {
      const dimensionValidation = await validateImageDimensions(file, validation);
      if (!dimensionValidation.valid) {
        toast({
          title: "图片尺寸不符合要求",
          description: dimensionValidation.message,
          variant: "destructive"
        });
        return;
      }
    } catch {
      toast({
        title: "图片验证失败",
        description: "无法验证图片尺寸",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await itemConfig.uploadAction(formData);
      if (result.success && result.data) {
        const newConfig = itemConfig.updateConfig(config, result.data);
        onConfigChange(newConfig);
        toast({
          title: "上传成功",
          description: result.message || itemConfig.successMessage
        });
      } else {
        toast({
          title: "上传失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "上传失败",
        description: `发生错误: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // 清空文件选择器
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const currentImage = itemConfig.getCurrentImage(config);
  return <Card>
      <CardHeader>
        <CardTitle>{itemConfig.title}</CardTitle>
        <CardDescription>{itemConfig.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${itemConfig.key}-upload`}>
              {itemConfig.uploadLabel}
            </Label>
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-2">
                <Input ref={fileInputRef} id={`${itemConfig.key}-upload`} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileSelect} disabled={isUploading} />
                <p className="text-sm text-muted-foreground">
                  {getValidationDescription(itemConfig.validation)}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="mr-1 h-4 w-4" />
                {isUploading ? "上传中..." : "选择文件"}
              </Button>
            </div>
          </div>

          {currentImage && <div className="space-y-2">
              <Label>当前图片预览</Label>
              <div className="flex items-start space-x-4">
                <div className="border rounded-lg p-2 bg-gray-50">
                  <BaseImage src={currentImage.url} alt={itemConfig.uploadLabel} width={200} height={200} className="rounded" />
                </div>
                <div className="flex-1 space-y-1 text-sm text-muted-foreground">
                  <p>版本号: {currentImage.version}</p>
                  <p>图片URL: {currentImage.url}</p>
                  <p>
                    云存储路径: cuoti/miniprogram/config/
                    {currentImage.pathPrefix}-{currentImage.version}
                  </p>
                </div>
              </div>
            </div>}

          {!currentImage && <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {itemConfig.emptyStateText}
              </p>
              <p className="text-xs text-gray-400">请选择一张图片上传</p>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
export default function ImageUploadComponent({
  config,
  onConfigChange
}) {
  return <div className="space-y-6">
      {imageUploadConfigs.map(itemConfig => <ImageUploadItem key={itemConfig.key} itemConfig={itemConfig} config={config} onConfigChange={onConfigChange} />)}
    </div>;
}
