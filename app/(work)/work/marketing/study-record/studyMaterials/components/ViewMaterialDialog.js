"use client";

import { Download } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
// 查看学习资料详情对话框组件，用于展示学习资料的完整信息和下载文件
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { dateToString } from "../../../../../../../lib/common/time.js";
const getStatusBadge = status => {
  if (status === "active") {
    return <Badge className="bg-green-100 text-green-800">可下载</Badge>;
  } else {
    return <Badge variant="destructive" className="text-white">
        已禁用
      </Badge>;
  }
};
const getTypeBadge = type => {
  const typeMap = {
    pdf: {
      label: "PDF",
      color: "bg-red-100 text-red-800"
    },
    word: {
      label: "Word",
      color: "bg-blue-100 text-blue-800"
    },
    excel: {
      label: "Excel",
      color: "bg-green-100 text-green-800"
    },
    ppt: {
      label: "PPT",
      color: "bg-orange-100 text-orange-800"
    },
    zip: {
      label: "压缩",
      color: "bg-purple-100 text-purple-800"
    },
    image: {
      label: "图片",
      color: "bg-pink-100 text-pink-800"
    },
    other: {
      label: "其他",
      color: "bg-gray-100 text-gray-800"
    }
  };
  const config = typeMap[type] || typeMap.other;
  return <Badge className={config.color}>{config.label}</Badge>;
};
const formatFileSize = sizeInBytes => {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
};
const handleDownload = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
export default function ViewMaterialDialog({
  open,
  onOpenChange,
  material
}) {
  if (!material) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学习资料详情</DialogTitle>
          <DialogDescription>查看学习资料的详细信息</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：资料标题和描述 */}
          <div className="space-y-4">
            {/* 资料标题 */}
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                资料标题
              </label>
              <div className="p-3 bg-gray-50 rounded-lg font-medium">
                {material.title}
              </div>
            </div>

            {/* 资料描述 */}
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                资料描述
              </label>
              <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                {material.description || "无描述"}
              </div>
            </div>

            {/* 老师备注 */}
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                老师备注
              </label>
              <div className="p-3 bg-gray-50 rounded-lg min-h-[80px]">
                {material.remark || "无备注"}
              </div>
            </div>
          </div>

          {/* 中间：下载文件 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-3">
                下载文件
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-blue-900">
                      {material.title}
                    </div>
                    <div className="text-sm text-blue-600">
                      {formatFileSize(material.file.fileSize)} •{" "}
                      {getTypeBadge(material.type)}
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleDownload(material.file.fileUrl, material.title)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  下载文件
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                上传者
              </label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                {material.uploaderUser?.userInfo?.name || "未知老师"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                更新时间
              </label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                {dateToString(new Date(material.updated))}
              </div>
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  班级
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {material.classroom?.name || "未知班级"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  文件大小
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {formatFileSize(material.file.fileSize)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  资料类型
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {getTypeBadge(material.type)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  资料状态
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {getStatusBadge(material.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
