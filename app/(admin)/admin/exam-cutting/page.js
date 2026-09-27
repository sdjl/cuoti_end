"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
// 试卷切题列表页面，显示所有待切题的试卷
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../../components/ui/card.js";
import { getExamPapersForCutting } from "./actions.js";

// 切题状态中文映射
const cuttingStatusMap = {
  waiting: "等待切题",
  pdf_splitting: "拆分PDF",
  cutting: "切题中",
  cropping: "裁剪中",
  failed: "切题失败"
};
export default function ExamCuttingPage() {
  const [examPapers, setExamPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取需要切题的试卷数据
  useEffect(() => {
    const fetchExamPapers = async () => {
      setIsLoading(true);
      try {
        const papers = await getExamPapersForCutting();
        setExamPapers(papers);
      } catch (error) {
        console.error("获取待切题试卷数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamPapers();
  }, []);

  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };
  return <div className="space-y-6">
      {isLoading ? <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">加载中...</span>
        </div> : examPapers.length === 0 ? <div className="text-center py-12">
          <p className="text-muted-foreground">暂无待切题的试卷</p>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examPapers.map(paper => <Link href={`/admin/exam-cutting/${paper._id}`} key={paper._id}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {paper.title}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">科目:</span>
                      <span>{paper.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">页数:</span>
                      <span>{paper.pdfPageCount || "未知"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上传时间:</span>
                      <span>{formatTime(paper.created)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">状态:</span>
                      <span className="font-medium text-orange-500">
                        {cuttingStatusMap[paper.cuttingStatus] || paper.cuttingStatus}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>)}
        </div>}
    </div>;
}
