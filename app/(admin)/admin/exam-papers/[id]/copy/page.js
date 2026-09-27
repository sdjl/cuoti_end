"use client";

import { Copy, Loader2 } from "lucide-react";
// 试卷复制页面，用于复制已锁定的试卷创建新副本
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { copyExamPaper, getExamPaperInfo } from "./actions.js";
export default function CopyPage() {
  const params = useParams();
  const id = params.id;
  const {
    toast
  } = useToast();
  const [examPaper, setExamPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  // 获取试卷信息
  useEffect(() => {
    const fetchExamPaper = async () => {
      try {
        const paper = await getExamPaperInfo(id);
        setExamPaper(paper);
      } catch (error) {
        console.error("获取试卷信息失败:", error);
        toast({
          title: "错误",
          description: "获取试卷信息失败",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamPaper();
  }, [id, toast]);

  // 处理复制试卷
  const handleCopy = async () => {
    if (!examPaper) return;
    setIsCopying(true);
    try {
      await copyExamPaper(id);
      toast({
        title: "成功",
        description: "试卷复制成功！"
      });

      // 复制成功后跳转到试卷列表页面
      window.location.href = `/admin/exam-papers`;
    } catch (error) {
      console.error("复制试卷失败:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "复制试卷失败",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };
  if (isLoading) {
    return <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>加载试卷信息中...</span>
        </div>
      </div>;
  }
  if (!examPaper) {
    return <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>错误</CardTitle>
          </CardHeader>
          <CardContent>
            <p>未找到该试卷信息</p>
          </CardContent>
        </Card>
      </div>;
  }
  if (!examPaper.isLocked) {
    return <div className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p>只有已锁定的试卷才能进行复制操作</p>
            <div className="mt-4">
              <Button onClick={() => window.close()}>关闭窗口</Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            复制试卷
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">试卷信息</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">试卷名称：</span>
                <span className="font-medium">{examPaper.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">科目：</span>
                <Badge variant="outline">{examPaper.subject}</Badge>
              </div>
              {examPaper.description && <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600">描述：</span>
                  <span>{examPaper.description}</span>
                </div>}
              {examPaper.questionCount && <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">题目数量：</span>
                  <span>{examPaper.questionCount} 题</span>
                </div>}
              {examPaper.pdfPageCount && <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">页数：</span>
                  <span>{examPaper.pdfPageCount} 页</span>
                </div>}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">状态：</span>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  已锁定
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">复制说明</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p>• 将创建一个新的未锁定试卷副本</p>
              <p>• 试卷的所有PDF文件和图片将被复制</p>
              <p>• 题目数据和基本信息将保持一致</p>
              <p>• 复制过程可能需要较长时间，请耐心等待</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCopy} disabled={isCopying} className="flex-1">
              {isCopying ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  复制中，请耐心等待...
                </> : <>
                  <Copy className="h-4 w-4 mr-2" />
                  确认复制试卷
                </>}
            </Button>
            <Button variant="outline" onClick={() => window.close()} disabled={isCopying}>
              取消
            </Button>
          </div>

          {isCopying && <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 复制过程中请不要关闭此页面，否则可能导致复制失败
              </p>
            </div>}
        </CardContent>
      </Card>
    </div>;
}
