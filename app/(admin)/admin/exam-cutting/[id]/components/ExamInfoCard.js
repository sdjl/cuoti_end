"use client";

// 试卷信息卡片组件，用于显示试卷的基本信息、切题状态和切题服务信息
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export default function ExamInfoCard({
  examPaper,
  cuttingServiceInfo
}) {
  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 获取切题状态文本
  const getCuttingStatusText = () => {
    switch (examPaper.cuttingStatus) {
      case "waiting":
        return "等待切题";
      case "pdf_splitting":
        return "正在拆分PDF";
      case "cutting":
        return "正在识别题目";
      case "cropping":
        return "正在裁剪题目图片";
      case "failed":
        return "切题失败";
      case "done":
        return "切题完成";
      default:
        return "未知状态";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle>试卷信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">标题</p>
            <p className="text-lg">{examPaper.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">科目</p>
            <p className="text-lg">{examPaper.subject}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">页数</p>
            <p className="text-lg">{examPaper.pdfPageCount || "未知"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              上传时间
            </p>
            <p className="text-lg">{formatTime(examPaper.created)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              切题服务
            </p>
            <p className="text-lg">{cuttingServiceInfo?.name || "加载中..."}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              切题状态
            </p>
            <p className="text-lg">{getCuttingStatusText()}</p>
          </div>
        </div>
      </CardContent>
    </Card>;
}
