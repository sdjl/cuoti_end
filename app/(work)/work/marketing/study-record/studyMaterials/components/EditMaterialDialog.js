"use client";

import { FileText, Upload, X } from "lucide-react";
// 编辑学习资料对话框组件，用于修改学习资料的信息和文件
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function EditMaterialDialog({
  open,
  onOpenChange,
  material,
  onSave,
  isSaving
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [status, setStatus] = useState("active");
  const [remark, setRemark] = useState("");
  useEffect(() => {
    if (open && material) {
      setTitle(material.title);
      setDescription(material.description || "");
      setNewFile(null);
      setStatus(material.status);
      setRemark(material.remark || "");
    }
  }, [open, material]);
  const handleFileChange = event => {
    const file = event.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };
  const handleRemoveNewFile = () => {
    setNewFile(null);
    // 重置文件输入
    const fileInput = document.getElementById("edit-file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      file: newFile || undefined,
      status,
      remark: remark.trim() || undefined
    });
  };
  const canSave = title.trim() && !isSaving;
  const formatFileSize = sizeInBytes => {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  };
  if (!material) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑学习资料</DialogTitle>
          <DialogDescription>
            编辑资料 {material.title} 的信息
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：基本信息 */}
          <div className="space-y-4">
            {/* 班级信息（只读） */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">
                所属班级
              </label>
              <div className="mt-1 text-sm">
                {material.classroom?.name || "未知班级"}
              </div>
            </div>

            {/* 资料标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">
                资料标题 <span className="text-red-500">*</span>
              </Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="请输入资料标题..." />
            </div>

            {/* 资料描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">资料描述</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="请输入资料描述..." rows={4} />
            </div>

            {/* 资料状态 */}
            <div className="space-y-2">
              <Label htmlFor="status">资料状态</Label>
              <Select value={status} onValueChange={value => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">可下载</SelectItem>
                  <SelectItem value="disabled">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 右侧：文件和设置 */}
          <div className="space-y-4">
            {/* 文件管理 */}
            <div className="space-y-3">
              <Label>文件管理</Label>

              {/* 当前文件 */}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  当前文件
                </label>
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{material.title}</div>
                      <div className="text-sm text-gray-600">
                        {formatFileSize(material.file.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 上传新文件 */}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  重新上传文件（可选）
                </label>

                {!newFile ? <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input type="file" onChange={handleFileChange} style={{
                  display: "none"
                }} id="edit-file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp" />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("edit-file-upload")?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      选择新文件
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      上传新文件将替换当前文件
                    </p>
                  </div> : <div className="mt-1 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">
                        {newFile.name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {formatFileSize(newFile.size)}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveNewFile} className="text-gray-500 hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>}
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="请输入备注信息..." rows={3} />
            </div>

            {/* 按钮区域 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
