"use client";

import { Trash2, Upload } from "lucide-react";
// 编辑学情记录对话框组件，用于修改学情记录内容和上传/删除图片
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
const getPointsBadge = points => {
  if (points > 0) {
    return <Badge className="bg-green-100 text-green-800">+{points}</Badge>;
  } else if (points < 0) {
    return <Badge variant="destructive">{points}</Badge>;
  } else {
    return <Badge variant="outline">0</Badge>;
  }
};
export default function EditStudyRecordDialog({
  open,
  onOpenChange,
  record,
  onSave,
  onUploadImage,
  onDeleteImage,
  isSaving,
  isUploading
}) {
  const [content, setContent] = useState("");
  useEffect(() => {
    if (open && record) {
      setContent(record.content || "");
    }
  }, [open, record]);
  const handleSave = async () => {
    if (!content.trim()) {
      return;
    }
    await onSave(content.trim());
  };
  const handleFileUpload = async event => {
    const file = event.target.files?.[0];
    if (file) {
      await onUploadImage(file);
      // 重置文件输入
      event.target.value = "";
    }
  };
  const handleDeleteImage = async imageFileID => {
    await onDeleteImage(imageFileID);
  };
  const openImageInNewTab = imageUrl => {
    window.open(imageUrl, "_blank");
  };
  if (!record) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑学情记录</DialogTitle>
          <DialogDescription>
            编辑学生 {record.student?.name} 的学情记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息（只读） */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-500">班级</label>
              <div className="mt-1 text-sm">
                {record.classroom?.name || "未知班级"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">学生</label>
              <div className="mt-1 text-sm">
                {record.student?.name}（{record.student?.studentCode}）
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                积分变动
              </label>
              <div className="mt-1">{getPointsBadge(record.points)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                操作老师
              </label>
              <div className="mt-1 text-sm">
                {record.operatorUser?.userInfo?.name || "未知老师"}
              </div>
            </div>
          </div>

          {/* 记录内容编辑 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              记录内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="请输入学情记录内容..." rows={4} />
          </div>

          {/* 图片管理 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>图片管理</Label>
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{
                display: "none"
              }} id="file-upload" disabled={isUploading} />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "上传中..." : "上传图片"}
                </Button>
              </div>
            </div>

            {/* 图片列表 */}
            {record.images && record.images.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {record.images.map((image, index) => <div key={image.imageFileID || index} className="relative group">
                    <BaseImage src={image.imageUrl} alt={`学情记录图片 ${index + 1}`} width={100} height={100} className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer" onClick={() => openImageInNewTab(image.imageUrl)} />
                    {/* 删除按钮 - 右上角 */}
                    <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white w-8 h-8 p-0" onClick={() => handleDeleteImage(image.imageFileID)}>
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>)}
              </div> : <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500">
                暂无图片，点击上传按钮添加图片
              </div>}
          </div>

          {/* 上传提示 */}
          <div className="text-sm text-gray-500">
            提示：图片上传后会立即保存，删除图片也会立即生效
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!content.trim() || isSaving}>
            {isSaving ? "保存中..." : "保存内容"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
