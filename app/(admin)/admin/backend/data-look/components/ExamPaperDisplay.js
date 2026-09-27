"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 试卷信息展示组件，用于显示试卷的基本信息、切题状态、统计信息、解析报告和时间信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function ExamPaperDisplay({
  data
}) {
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getStatusColor = status => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          试卷信息
          <Badge variant="secondary">exam_paper</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{data._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">标题:</span>
              <p>{data.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">科目:</span>
              <p>{data.subject}</p>
            </div>
            <div>
              <span className="text-muted-foreground">是否锁定:</span>
              <Badge variant={data.isLocked ? "destructive" : "secondary"}>
                {data.isLocked ? "已锁定" : "未锁定"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 状态信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">切题状态</h3>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(data.cuttingStatus)}>
              {data.cuttingStatus}
            </Badge>
            {data.cuttingError && <span className="text-red-600 text-sm">
                错误: {data.cuttingError}
              </span>}
          </div>
        </div>

        <Separator />

        {/* 统计信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">统计信息</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground">题目数量:</span>
              <p>{data.questionCount || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">页数:</span>
              <p>{data.pdfPageCount || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">页面数据:</span>
              <p>{data.pages?.length || 0} 页</p>
            </div>
          </div>
        </div>

        {/* 解析报告 */}
        {data.analysisReport && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">解析报告</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">分析完成:</span>
                  <Badge variant={data.analysisReport.isDone ? "default" : "secondary"}>
                    {data.analysisReport.isDone ? "已完成" : "未完成"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">缺少答案:</span>
                    <span className="ml-2">
                      {data.analysisReport.missingAnswerCount ?? "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">缺少解析:</span>
                    <span className="ml-2">
                      {data.analysisReport.missingParseCount ?? "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">缺少知识点:</span>
                    <span className="ml-2">
                      {data.analysisReport.missingKnowledgePointCount ?? "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">缺少坐标:</span>
                    <span className="ml-2">
                      {data.analysisReport.missingCoordinateCount ?? "未知"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>}

        <Separator />

        {/* 时间信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>
              <p>{formatDate(data.created)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>
              <p>{formatDate(data.updated)}</p>
            </div>
          </div>
        </div>

        {/* 描述和备注 */}
        {(data.description || data.notes) && <>
            <Separator />
            <div className="space-y-2">
              {data.description && <div>
                  <span className="text-muted-foreground">描述:</span>
                  <p className="text-sm">{data.description}</p>
                </div>}
              {data.notes && <div>
                  <span className="text-muted-foreground">备注:</span>
                  <p className="text-sm">{data.notes}</p>
                </div>}
            </div>
          </>}
      </CardContent>
    </Card>;
}
