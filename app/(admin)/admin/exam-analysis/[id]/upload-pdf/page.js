"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 上传解析PDF页面，提供PDF文件上传、预览、文本提取和上传到云存储的功能
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { generateUploadUrl, uploadAnalysisPdfWithCosFile } from "./actions.js";
import { PdfTextDisplay } from "./components/PdfTextDisplay.js";
import { UploadCard } from "./components/UploadCard.js";
const CARD_HEIGHT = 720;
function UploadPdfPageComponent() {
  const params = useParams();
  const examId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAnalysisPage = searchParams.get("from_analysis_page") || "1";
  const {
    toast
  } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [pdfjsReady, setPdfjsReady] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [pdfText, setPdfText] = useState("");

  // 清理预览URL对象
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 加载本地PDF.js库
  useEffect(() => {
    const loadPdfJs = () => {
      // 检查是否已经加载
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf/pdf.worker.min.mjs";
        setPdfjsReady(true);
        return;
      }

      // 动态加载本地 PDF.js 脚本
      const script = document.createElement("script");
      script.src = "/js/pdf/pdf.min.mjs";
      script.type = "module";
      script.onload = () => {
        // 等待模块加载完成
        setTimeout(() => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf/pdf.worker.min.mjs";
            setPdfjsReady(true);
          } else {
            console.error("PDF.js 加载失败");
          }
        }, 100);
      };
      script.onerror = () => {
        console.error("PDF.js 脚本加载失败");
      };

      // 添加全局对象支持
      const initScript = document.createElement("script");
      initScript.text = `
        import * as pdfjsLib from '/js/pdf/pdf.min.mjs';
        window.pdfjsLib = pdfjsLib;
      `;
      initScript.type = "module";
      document.head.appendChild(initScript);
      document.head.appendChild(script);
    };
    loadPdfJs();
  }, []);

  // 提取PDF文本内容
  const extractPdfText = useCallback(async file => {
    if (!pdfjsReady || !window.pdfjsLib) {
      console.error("PDF.js未加载完成");
      return;
    }
    setExtractingText(true);
    setPdfText("");
    try {
      // 将文件转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // 加载PDF文档
      const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
      const pdfDoc = await loadingTask.promise;
      let allText = "";
      const totalPages = pdfDoc.numPages;

      // 遍历所有页面
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        let pageText = "";
        textContent.items.forEach(item => {
          // 保留原有的换行符和空格
          if (item.hasEOL) {
            pageText += `${item.str}\n`;
          } else {
            pageText += item.str;
          }
        });
        allText += pageText;
      }
      setPdfText(allText);
    } catch (error) {
      console.error("提取PDF文本时出错:", error);
      toast({
        title: "文本提取失败",
        description: "无法提取PDF文本内容",
        variant: "destructive"
      });
    } finally {
      setExtractingText(false);
    }
  }, [pdfjsReady, toast]);

  // 当PDF.js加载完成且有文件时，提取文本
  useEffect(() => {
    if (pdfjsReady && file && file.type === "application/pdf") {
      extractPdfText(file);
    }
  }, [pdfjsReady, file, extractPdfText]);

  // 处理文件设置的通用函数
  const setFileWithExtraction = async newFile => {
    // 检查文件类型
    if (newFile.type !== "application/pdf") {
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
    setPdfText("");
    setFileUploaded(false);

    // 更新文件
    setFile(newFile);

    // 创建文件预览URL（浏览器端）
    setPreviewUrl(URL.createObjectURL(newFile));

    // 如果PDF.js已经加载完成，则开始提取文本
    if (pdfjsReady) {
      await extractPdfText(newFile);
    }
    toast({
      title: "文件已选择",
      description: `已选择文件: ${newFile.name}`
    });
  };

  // 文件变更处理
  const handleFileChange = async e => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      await setFileWithExtraction(selectedFile);
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
  const handleDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      await setFileWithExtraction(droppedFile);
    }
  };

  // 删除文件
  const handleDeleteFile = () => {
    setFile(null);
    setFileUploaded(false);
    setPdfText("");

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
    if (!file) return null;
    try {
      // 1. 获取上传URL和签名（服务端用永久密钥签名，安全）
      const result = await generateUploadUrl(file.name);
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
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`上传失败，状态码：${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => {
          console.error("XHR请求发生错误");
          reject(new Error("网络请求失败"));
        };
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Authorization", authorization);

        // generateCosUploadInfo使用永久密钥签名，不需要sessionToken
        xhr.send(file);
      });
      setFileUploaded(true);
      // 返回cosKey用于后续下载
      return cosKey;
    } catch (error) {
      console.error("上传文件到COS失败:", error);
      throw new Error(error instanceof Error ? error.message : "文件上传失败");
    }
  };

  // 获取按钮文案
  const getButtonText = () => {
    if (isUploading) {
      if (!fileUploaded) {
        return "上传文件中...";
      } else {
        return "保存数据中...";
      }
    }
    return "上传解析PDF";
  };

  // 上传文件
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "无法上传",
        description: "请先选择PDF文件",
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

      // 第二步：服务端下载、转存、删除，并保存解析PDF记录
      const result = await uploadAnalysisPdfWithCosFile({
        examId,
        cosKey,
        pdfText
      });
      if (result.success) {
        toast({
          title: "上传成功",
          description: "解析PDF已成功上传"
        });

        // 上传成功后返回分析列表页面，带上页码参数
        setTimeout(() => {
          router.push(`/admin/exam-analysis?analysis_page=${fromAnalysisPage}`);
        }, 1000);
      } else {
        toast({
          title: "上传失败",
          description: result.message,
          variant: "destructive"
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error("上传错误:", error);
      toast({
        title: "上传错误",
        description: error instanceof Error ? error.message : "上传过程中发生错误，请重试",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };
  return <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 左侧：上传区域 */}
        <UploadCard file={file} isDragOver={isDragOver} isUploading={isUploading} fileUploaded={fileUploaded} previewUrl={previewUrl} onFileChange={handleFileChange} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onDeleteFile={handleDeleteFile} onUpload={handleUpload} fileInputRef={fileInputRef} getButtonText={getButtonText} cardHeight={CARD_HEIGHT} />

        {/* 右侧：PDF文本内容显示区域 */}
        <PdfTextDisplay extractingText={extractingText} pdfText={pdfText} cardHeight={CARD_HEIGHT} />
      </div>
    </div>;
}

// 使用动态导入禁用 SSR
export default dynamic(() => Promise.resolve(UploadPdfPageComponent), {
  ssr: false,
  loading: () => <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-1 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">上传解析PDF</h3>
          <p className="text-sm text-muted-foreground mb-4">正在加载页面...</p>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">正在初始化PDF处理器...</div>
          </div>
        </div>
        <div className="col-span-1 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">PDF文本内容</h3>
          <p className="text-sm text-muted-foreground mb-4">正在加载页面...</p>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">正在初始化文本显示器...</div>
          </div>
        </div>
      </div>
    </div>
});
