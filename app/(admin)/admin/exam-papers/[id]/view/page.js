"use client";

import { FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 试卷查看页面，用于预览试卷的PDF文件
import { useEffect, useState } from "react";
import PdfViewer from "../../../../../../components/admin/exam-info/PdfViewer.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getExamPaperForView } from "./actions.js";
export default function ExamPaperViewPage() {
  const params = useParams();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const examPaperId = params.id;
  const [examPaper, setExamPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载试卷数据
  useEffect(() => {
    const loadExamPaper = async () => {
      if (!examPaperId) return;
      try {
        setIsLoading(true);
        const data = await getExamPaperForView(examPaperId);
        if (!data) {
          toast({
            title: "错误",
            description: "试卷不存在或已被删除",
            variant: "destructive"
          });
          router.push("/admin/exam-papers");
          return;
        }
        setExamPaper(data);
      } catch (error) {
        console.error("获取试卷数据失败:", error);
        toast({
          title: "错误",
          description: "获取试卷数据失败",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadExamPaper();
  }, [examPaperId, toast, router]);
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">正在加载试卷数据...</p>
          </div>
        </div>
      </div>;
  }
  if (!examPaper) {
    return <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">试卷数据加载失败</p>
          <Button variant="outline" onClick={() => router.push("/admin/exam-papers")} className="mt-4">
            返回试卷列表
          </Button>
        </div>
      </div>;
  }
  return <div className="container mx-auto space-y-6">
      {/* PDF预览 */}
      {examPaper.pdfUrl ? <PdfViewer pdfUrl={examPaper.pdfUrl} title={examPaper.title} /> : <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>PDF文件不可用</p>
              <p className="text-sm">试卷可能正在处理中，请稍后刷新页面</p>
            </div>
          </CardContent>
        </Card>}
    </div>;
}
