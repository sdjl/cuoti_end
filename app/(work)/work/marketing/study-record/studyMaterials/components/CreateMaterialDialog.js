"use client";

import { Upload, X } from "lucide-react";
// 新建学习资料对话框组件，用于创建和上传新的学习资料
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function CreateMaterialDialog({
  open,
  onOpenChange,
  classrooms,
  onSave,
  isSaving
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("active");
  const [remark, setRemark] = useState("");

  // 重置表单
  useEffect(() => {
    if (open) {
      setSelectedClassroomId("");
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setStatus("active");
      setRemark("");
    }
  }, [open]);
  const handleFileChange = event => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  const handleRemoveFile = () => {
    setSelectedFile(null);
    // 重置文件输入
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  const handleSave = async () => {
    if (!selectedClassroomId || !title.trim() || !selectedFile) {
      return;
    }
    await onSave({
      classroomId: selectedClassroomId,
      title: title.trim(),
      description: description.trim() || undefined,
      file: selectedFile,
      status,
      remark: remark.trim() || undefined
    });
  };
  const canSave = selectedClassroomId && title.trim() && selectedFile && !isSaving;
  const formatFileSize = sizeInBytes => {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>新建学习资料</DialogTitle>
          <DialogDescription>上传新的学习资料供学生下载</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：基本信息 */}
          <div className="space-y-4">
            {/* 班级选择 */}
            <div className="space-y-2">
              <Label htmlFor="classroom">
                所属班级 <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                      {classroom.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
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
          <div className="space-y-4 flex flex-col">
            {/* 文件上传 */}
            <div className="space-y-2">
              <Label>
                上传文件 <span className="text-red-500">*</span>
              </Label>

              {!selectedFile ? <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input type="file" onChange={handleFileChange} style={{
                display: "none"
              }} id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp" />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    支持 PDF、Word、Excel、PPT、压缩包、图片等格式
                  </p>
                </div> : <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700">
                    <X className="h-4 w-4" />
                  </Button>
                </div>}
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="请输入备注信息..." rows={3} />
            </div>

            {/* 按钮区域 */}
            <div className="flex justify-end gap-2 pt-4 h-auto items-end flex-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                {isSaving ? "创建中..." : "创建"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
