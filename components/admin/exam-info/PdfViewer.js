"use client";

import { ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, RefreshCw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card.js";
import { Input } from "../../ui/input.js";
import { useToast } from "../../../hooks/use-toast.js";
export default function PdfViewer({
  pdfUrl,
  title
}) {
  const canvasRef = useRef(null);
  // PDF.js 文档对象类型由第三方库定义，使用 unknown 类型
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [pdfjsReady, setPdfjsReady] = useState(false);
  const {
    toast
  } = useToast();

  // 加载PDF.js库
  useEffect(() => {
    const loadPdfJs = () => {
      // 检查是否已经加载
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf/pdf.worker.min.mjs";
        setPdfjsReady(true);
        return;
      }

      // 加载本地PDF.js文件
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
            setIsLoading(false);
            toast({
              title: "错误",
              description: "PDF.js 加载失败，请确保 /js/pdf/pdf.min.mjs 文件存在",
              variant: "destructive"
            });
          }
        }, 100);
      };
      script.onerror = () => {
        setIsLoading(false);
        toast({
          title: "错误",
          description: "PDF.js 文件加载失败，请检查 /js/pdf/pdf.min.mjs 文件是否存在",
          variant: "destructive"
        });
      };

      // 添加全局对象支持
      const initScript = document.createElement("script");
      initScript.text = `
        import * as pdfjsLib from '/js/pdf/pdf.min.mjs';
        window.pdfjsLib = pdfjsLib;
      `;
      initScript.type = "module";
      initScript.onerror = () => {
        setIsLoading(false);
        toast({
          title: "错误",
          description: "PDF.js 模块初始化失败",
          variant: "destructive"
        });
      };
      document.head.appendChild(initScript);
      document.head.appendChild(script);
    };
    loadPdfJs();
  }, [toast]);

  // 加载PDF文档
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl || !pdfjsReady || !window.pdfjsLib) return;
      try {
        setIsLoading(true);

        // 加载PDF文档
        const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setPageInput("1");
      } catch (error) {
        console.error("加载PDF失败:", error);
        toast({
          title: "错误",
          description: "PDF文件加载失败，请检查文件是否存在",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [pdfUrl, pdfjsReady, toast]);

  // 渲染PDF页面
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !window.pdfjsLib) return;
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // 计算视口
        const viewport = page.getViewport({
          scale: scale,
          rotation: rotation
        });

        // 设置canvas尺寸
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 渲染页面
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
      } catch (error) {
        console.error("渲染PDF页面失败:", error);
        toast({
          title: "错误",
          description: "PDF页面渲染失败",
          variant: "destructive"
        });
      }
    };
    renderPage();
  }, [pdfDoc, currentPage, scale, rotation, toast]);

  // 上一页
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  }, [currentPage]);

  // 下一页
  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  }, [currentPage, numPages]);

  // 跳转到指定页面
  const goToPage = () => {
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInput(currentPage.toString());
      toast({
        title: "错误",
        description: `请输入1-${numPages}之间的页码`,
        variant: "destructive"
      });
    }
  };

  // 放大
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  // 缩小
  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  // 旋转
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // 重置缩放
  const resetZoom = () => {
    setScale(1.5);
    setRotation(0);
  };

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // 下载PDF
  const downloadPdf = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = title ? `${title}.pdf` : "exam_paper.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = e => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowLeft":
          goToPreviousPage();
          break;
        case "ArrowRight":
          goToNextPage();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "r":
        case "R":
          rotate();
          break;
        case "0":
          resetZoom();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, numPages, goToNextPage, goToPreviousPage, toggleFullscreen]);
  if (isLoading) {
    return <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">正在加载PDF文件...</p>
        </div>
      </Card>;
  }
  return <div className={`w-full ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      <Card className={`${isFullscreen ? "h-full" : ""}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title || "PDF预览"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadPdf} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="flex items-center gap-1">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? "退出全屏" : "全屏"}
              </Button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            {/* 页面控制 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                <Input type="number" min="1" max={numPages} value={pageInput} onChange={e => setPageInput(e.target.value)} onBlur={goToPage} onKeyPress={e => e.key === "Enter" && goToPage()} className="w-16 h-8 text-center" />
                <span className="text-sm text-gray-600">/ {numPages}</span>
              </div>

              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= numPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 缩放和旋转控制 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>

              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={resetZoom}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isFullscreen ? "h-full overflow-auto" : ""}`}>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="border border-gray-200 shadow-lg max-w-full h-auto" />
          </div>
        </CardContent>
      </Card>
    </div>;
}
