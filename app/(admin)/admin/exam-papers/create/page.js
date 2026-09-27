"use client";

import { useRouter } from "next/navigation";
// 创建试卷页面，用于填写试卷基本信息和上传PDF文件
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../hooks/useAdminConfig.js";
import { createExamPaperWithCosFile, generateUploadUrl } from "./actions.js";
import { BasicInfoCard } from "./components/BasicInfoCard.js";
import { UploadPdfCard } from "./components/UploadPdfCard.js";
export default function CreateExamPaperPage() {
  const router = useRouter();
  const {
    toast
  } = useToast();
  const {
    subjects
  } = useSubjects();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    notes: "",
    file: null
  });

  // 清理预览URL对象
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 处理文件设置的通用函数
  const setFile = file => {
    // 检查文件类型
    if (file.type !== "application/pdf") {
      toast({
        title: "文件类型错误",
        description: "只能上传PDF格式的文件",
        variant: "destructive"
      });
      return;
    }

    // 先清除之前的状态
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // 更新文件
    setFormData(prev => ({
      ...prev,
      file
    }));

    // 创建文件预览URL
    setPreviewUrl(URL.createObjectURL(file));
    toast({
      title: "文件已选择",
      description: `已选择文件: ${file.name}`
    });
  };

  // 文件变更处理
  const handleFileChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);
    }
  };

  // 拖拽进入处理
  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  // 拖拽离开处理
  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // 拖拽覆盖处理
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 拖拽释放处理
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  // 删除文件
  const handleDeleteFile = () => {
    setFormData(prev => ({
      ...prev,
      file: null
    }));

    // 清除预览URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 使用新方式上传文件到COS
  const uploadFileToCos = async () => {
    if (!formData.file) return null;
    try {
      // 1. 获取上传URL和签名（服务端用永久密钥签名，安全）
      const result = await generateUploadUrl(formData.file.name);
      if (!result.success || !result.data) {
        console.error("获取上传URL失败:", result.error);
        throw new Error(result.error || "获取上传URL失败");
      }
      const {
        uploadUrl,
        authorization,
        cosKey
      } = result.data;

      // 2. 直接上传文件到COS
      const xhr = new XMLHttpRequest();
      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            console.error("上传失败详情:", {
              status: xhr.status,
              statusText: xhr.statusText,
              response: xhr.responseText
            });
            reject(new Error(`上传失败，状态码：${xhr.status}`));
          }
        };
        xhr.onerror = () => {
          console.error("上传请求错误");
          reject(new Error("上传过程中发生错误"));
        };
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Authorization", authorization);

        // generateCosUploadInfo使用永久密钥签名，不需要sessionToken
        xhr.send(formData.file);
      });

      // 3. 返回COS文件路径
      return cosKey;
    } catch (error) {
      console.error("上传文件到COS失败:", error);
      throw new Error(error instanceof Error ? error.message : "文件上传失败");
    }
  };

  // 获取按钮文案
  const getButtonText = () => {
    if (isUploading) {
      return "创建试卷中...";
    }
    return "创建试卷";
  };

  // 表单提交处理
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.title || !formData.subject || !formData.file) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段并上传试卷文件",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);
    try {
      // 第一步：上传文件到COS
      const cosKey = await uploadFileToCos();
      if (!cosKey) {
        throw new Error("文件上传失败");
      }

      // 第二步：创建试卷记录（包含下载、转存、删除临时文件）
      const result = await createExamPaperWithCosFile({
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        notes: formData.notes,
        cosKey: cosKey
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: "试卷已成功创建，文件已转存到云存储"
        });

        // 提交成功后返回列表页
        setTimeout(() => {
          router.push("/admin/exam-papers");
        }, 1000);
      } else {
        toast({
          title: "创建失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("提交表单失败:", error);
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建试卷失败",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  return <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <BasicInfoCard title={formData.title} subject={formData.subject} description={formData.description} notes={formData.notes} subjects={subjects} isUploading={isUploading} onTitleChange={value => setFormData(prev => ({
        ...prev,
        title: value
      }))} onSubjectChange={value => setFormData(prev => ({
        ...prev,
        subject: value
      }))} onDescriptionChange={value => setFormData(prev => ({
        ...prev,
        description: value
      }))} onNotesChange={value => setFormData(prev => ({
        ...prev,
        notes: value
      }))} />

        <UploadPdfCard file={formData.file} isDragOver={isDragOver} isUploading={isUploading} previewUrl={previewUrl} title={formData.title} subject={formData.subject} onFileChange={handleFileChange} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onDeleteFile={handleDeleteFile} onSubmit={handleSubmit} fileInputRef={fileInputRef} getButtonText={getButtonText} />
      </div>
    </div>;
}
