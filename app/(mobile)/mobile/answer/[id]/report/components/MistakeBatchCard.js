"use client";

import { CheckCircle, Download } from "lucide-react";
// 错题集卡片组件，显示最近的课程错题集信息、生成状态和下载按钮
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function MistakeBatchCard({
  mistakeBatchData,
  showButtons,
  onDownloadClick
}) {
  // 格式化时间
  const formatTime = timestamp => {
    if (!timestamp) return "未知";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 获取状态文本和样式
  const getStatusInfo = status => {
    const statusMap = {
      waiting: {
        text: "等待生成",
        color: "text-gray-600",
        bg: "bg-gray-100"
      },
      generating: {
        text: "生成中",
        color: "text-blue-600",
        bg: "bg-blue-100"
      },
      completed: {
        text: "已生成",
        color: "text-green-600",
        bg: "bg-green-100"
      },
      failed: {
        text: "生成失败",
        color: "text-red-600",
        bg: "bg-red-100"
      },
      waiting_clean: {
        text: "等待清理",
        color: "text-yellow-600",
        bg: "bg-yellow-100"
      },
      cleaning: {
        text: "清理中",
        color: "text-orange-600",
        bg: "bg-orange-100"
      },
      cleaned: {
        text: "已清理",
        color: "text-gray-600",
        bg: "bg-gray-100"
      },
      clean_failed: {
        text: "清理失败",
        color: "text-red-600",
        bg: "bg-red-100"
      }
    };
    return statusMap[status] || statusMap.waiting;
  };
  if (!mistakeBatchData) {
    return <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-600 font-medium">
              最近的课程错题集
            </span>
          </div>
          <CardTitle className="text-lg font-bold text-gray-700">
            暂无错题集数据
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showButtons && <div>
              <button onClick={onDownloadClick} className="w-full bg-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2" type="button">
                <Download className="w-4 h-4" />
                去下载错题集PDF
              </button>
            </div>}
        </CardContent>
      </Card>;
  }
  const {
    pdf,
    task
  } = mistakeBatchData;
  const statusInfo = getStatusInfo(pdf.status);
  return <Card className="w-full">
      <CardHeader className="pb-3">
        {/* 板块标识 */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-purple-600 font-medium">
            最近的课程错题集
          </span>
        </div>
        {/* 错题集标题 */}
        <CardTitle className="text-xl font-bold text-purple-700 mb-1">
          {task.taskName}
        </CardTitle>
        {/* 错题集描述 */}
        {task.taskDescription && <p className="text-sm text-gray-600 mt-1">{task.taskDescription}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 状态标签 */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">生成状态</span>
          <div className={`${statusInfo.bg} ${statusInfo.color} px-3 py-1 rounded-full text-xs font-medium`}>
            {statusInfo.text}
          </div>
        </div>

        {/* 错题集信息 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
          {/* 生成时间 */}
          <div className="flex items-center text-sm">
            <span className="text-purple-600 font-medium min-w-20">
              生成时间：
            </span>
            <span className="text-gray-700">{formatTime(pdf.created)}</span>
          </div>

          {/* 题目数量 */}
          <div className="flex items-center text-sm">
            <span className="text-purple-600 font-medium min-w-20">
              题目数量：
            </span>
            <span className="text-gray-700">{pdf.mistakeCount} 道</span>
          </div>

          {/* 下载状态 */}
          <div className="flex items-center text-sm">
            <span className="text-purple-600 font-medium min-w-20">
              下载状态：
            </span>
            <span className="text-gray-700">
              {pdf.hasDownloadedMistakePdf ? <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  已下载
                  {pdf.mistakePdfDownloadedAt && <span className="text-xs text-gray-500 ml-1">
                      ({formatTime(pdf.mistakePdfDownloadedAt)})
                    </span>}
                </span> : <span className="text-gray-500">未下载</span>}
            </span>
          </div>

          {/* 答案提交状态 */}
          <div className="flex items-center text-sm">
            <span className="text-purple-600 font-medium min-w-20">
              答案提交：
            </span>
            <span className="text-gray-700">
              {pdf.hasResubmittedAnswer ? <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  已提交
                  {pdf.answerResubmittedAt && <span className="text-xs text-gray-500 ml-1">
                      ({formatTime(pdf.answerResubmittedAt)})
                    </span>}
                </span> : <span className="text-gray-500">未提交</span>}
            </span>
          </div>
        </div>

        {/* 按钮区域 */}
        {showButtons && <div className="pt-2">
            <button onClick={onDownloadClick} className="w-full bg-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2" type="button">
              <Download className="w-4 h-4" />
              去下载错题集PDF
            </button>
          </div>}
      </CardContent>
    </Card>;
}
